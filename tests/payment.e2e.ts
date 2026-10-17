import { expect, test } from '@playwright/test';
import { loginDemo } from './helpers/auth';
import { checkoutAddress } from './helpers/checkout';

test.beforeEach(async ({ page }) => {
  await loginDemo(page);
});

test('navega do carrinho ao pagamento e valida os dados obrigatórios', async ({ page }) => {
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);

  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
  await expect(page).toHaveURL(/\/payment$/);
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Seus NFTs' })).toBeVisible();
  await expect(page.getByText('Emerald Ape #042')).toBeVisible();

  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByText('Informe seu nome de exibição.')).toBeVisible();
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
});

test('exibe o carrinho compacto no mobile e permite ajustar a quantidade', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'));

  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);

  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByText('Edição: 1/10')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Código promocional' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegação inferior' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click();
  await expect(page.getByRole('article').getByLabel('Quantidade', { exact: true })).toHaveText('2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
  await expect(page).toHaveURL(/\/payment$/);
});

test('percorre os campos do perfil por linha ao usar Tab', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'));

  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();

  const fields = [
    page.getByRole('textbox', { name: 'Nome de exibição' }),
    page.getByRole('textbox', { name: 'Nome de usuário' }),
    page.getByRole('combobox', { name: 'Rede', exact: true }),
    page.getByRole('textbox', { name: 'Nome do perfil' }),
    page.getByRole('textbox', { name: 'Endereço da carteira' }),
    page.getByRole('textbox', { name: 'ENS ou carteira secundária (opcional)' }),
  ];

  await fields[0].focus();
  for (const field of fields.slice(1)) {
    await page.keyboard.press('Tab');
    await expect(field).toBeFocused();
  }
});

test('conclui a compra demonstrativa e retorna ao catálogo com o carrinho vazio', async ({
  page,
}) => {
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();

  await page.getByRole('textbox', { name: 'Nome de exibição' }).fill('Colecionador');
  await page.getByRole('combobox', { name: 'Rede', exact: true }).click();
  await page.getByRole('option', { name: 'Ethereum', exact: true }).click();
  await page.getByRole('textbox', { name: 'Endereço da carteira' }).fill(checkoutAddress);
  await page.getByRole('combobox', { name: 'Tipo de carteira' }).click();
  await page.getByRole('option', { name: 'MetaMask', exact: true }).click();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('colecionador@example.com');
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('colecionador');
  await page.getByRole('textbox', { name: 'Nome do perfil' }).fill('Minha coleção');
  const total = await page.getByLabel('Valores do pedido').getByText(/ETH$/).last().innerText();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(page).toHaveURL(/\/payment\/confirmation(?:\?|$)/);
  const savedWallets = await page.evaluate(async () => (await fetch('/api/wallets')).json());
  expect(savedWallets.primary).toMatchObject({
    network: 'ethereum',
    walletAddress: checkoutAddress,
    walletType: 'metamask',
  });
  await page.locator('.receipt-reveal').evaluate(async (element) => {
    await Promise.all(
      element.getAnimations({ subtree: true }).map((animation) => animation.finished)
    );
  });
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await expect(page.getByText(total, { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Coinbase Wallet', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver no Etherscan' })).toBeEnabled();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth <= window.innerWidth && root.scrollHeight <= window.innerHeight;
    })
  ).toBe(true);
  const receiptBounds = await page.locator('.receipt-paper').boundingBox();
  expect(receiptBounds).not.toBeNull();
  if (receiptBounds) {
    const height = page.viewportSize()?.height ?? 0;
    expect(receiptBounds.y).toBeGreaterThanOrEqual(0);
    expect(receiptBounds.y + receiptBounds.height).toBeLessThanOrEqual(height);
    expect(Math.abs(receiptBounds.y + receiptBounds.height / 2 - height / 2)).toBeLessThan(2);
  }
  await page.screenshot({
    path: `/tmp/payment-confirmation-${test.info().project.name}.png`,
    fullPage: true,
  });

  await page.getByRole('link', { name: 'Ver atividades' }).click();
  await expect(page).toHaveURL(/\/activity$/);
  await expect(page.getByRole('heading', { name: 'Compra concluída' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible();
  await expect(page.getByText(total, { exact: true }).last()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Compra concluída' })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `/tmp/activity-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('link', { name: 'Início', exact: true }).click();
  await expect(page).toHaveURL(/\/?\?page=1/);
  await page.getByRole('link', { name: 'Carrinho, 0 itens' }).click();
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});

test('oferece retorno ao início ao acessar a confirmação sem um pedido', async ({ page }) => {
  await page.goto('/payment/confirmation');
  await expect(page.getByRole('heading', { name: 'Nenhum pedido para exibir' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voltar para o início' })).toBeVisible();
});
