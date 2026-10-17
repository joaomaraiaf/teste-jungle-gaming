import { type Page, expect, test } from '@playwright/test';
import { loginDemo, loginInDialog, loginTrigger } from './helpers/auth';
import { saveCheckoutWallet } from './helpers/checkout';

function checkoutNftSummary(page: Page) {
  const viewportWidth = page.viewportSize()?.width ?? 0;

  return viewportWidth < 768
    ? page.getByRole('region', { name: 'Resumo do pedido' })
    : page.locator('aside');
}

async function buyAndOpenCheckout(page: Page) {
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
}
async function fillCheckout(page: Page) {
  await page.getByRole('textbox', { name: 'Nome de exibição' }).fill('Nome preservado');
  await page.getByRole('combobox', { name: 'Rede', exact: true }).click();
  await page.getByRole('option', { name: 'Ethereum', exact: true }).click();
  await page.getByRole('textbox', { name: 'Endereço da carteira' }).fill(`0x${'a'.repeat(40)}`);
  await page.getByRole('combobox', { name: 'Tipo de carteira' }).click();
  await page.getByRole('option', { name: 'MetaMask', exact: true }).click();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('alice@kurio.test');
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('AliceDemo');
  await page.getByRole('textbox', { name: 'Nome do perfil' }).fill('Coleção preservada');
}
async function expireSession(page: Page) {
  expect(
    await page.evaluate(
      async () => (await fetch('/api/__mock/auth/expire-session', { method: 'POST' })).status
    )
  ).toBe(204);
}

test('mantém contas independentes em duas abas, inclusive após refresh e logout', async ({
  page,
  context,
}) => {
  await loginDemo(page);
  const other = await context.newPage();
  await loginDemo(other, 'bruno@kurio.test');
  await page.goto('/profile');
  await other.goto('/profile');
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'alice@kurio.test'
  );
  await expect(other.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'bruno@kurio.test'
  );
  await page.reload();
  await other.reload();
  await expect(page.getByRole('button', { name: 'Conta de AliceDemo' })).toBeVisible();
  await expect(other.getByRole('button', { name: 'Conta de BrunoDemo' })).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('kurio:mock-auth:v1') ?? '{}').session
    )
  ).toBeUndefined();
  await page.getByRole('complementary').getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/\?/);
  await expect(loginTrigger(page)).toBeVisible();
  await other.reload();
  await expect(other.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'bruno@kurio.test'
  );
  await other.close();
});

test('exige login no checkout e retoma o carrinho visitante mesmo após refresh no login', async ({
  page,
}) => {
  await buyAndOpenCheckout(page);
  await expect(page).toHaveURL(/redirect=%2Fpayment/);
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible();
  await page.reload();
  await loginInDialog(page);
  await expect(page).toHaveURL(/\/payment$/);
  await expect(checkoutNftSummary(page).getByText('Emerald Ape #042')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toBeVisible();
});

test('revalida a sessão antes de enviar e preserva o formulário para retomar após expiração', async ({
  page,
}) => {
  await loginDemo(page);
  await buyAndOpenCheckout(page);
  await fillCheckout(page);
  await saveCheckoutWallet(page);
  await expireSession(page);
  const purchases: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/orders') && request.method() === 'POST')
      purchases.push(request.url());
  });
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible();
  expect(purchases).toHaveLength(0);
  await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveCount(0);
  await page.reload();
  await loginInDialog(page);
  await expect(page).toHaveURL(/\/payment$/);
  await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveValue(
    'Nome preservado'
  );
  await expect(page.getByRole('textbox', { name: 'Nome do perfil' })).toHaveValue(
    'Coleção preservada'
  );
  if (test.info().project.name === 'mobile') {
    expect(
      await page.evaluate(async () => (await (await fetch('/api/cart')).json()).items[0].nftId)
    ).toBe('nft-001');
  } else await expect(checkoutNftSummary(page).getByText('Emerald Ape #042')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await expect(page).toHaveURL(/\/payment\/confirmation(?:\?|$)/);
  expect(purchases).toHaveLength(1);
});

test('não retoma dados do checkout de outra conta após expiração', async ({ page }) => {
  await loginDemo(page);
  await buyAndOpenCheckout(page);
  await fillCheckout(page);
  await saveCheckoutWallet(page);
  await expireSession(page);
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await loginInDialog(page, 'bruno@kurio.test');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveCount(0);
  expect(
    await page.evaluate(async () => {
      const response = await fetch('/api/orders');
      return response.json();
    })
  ).toEqual([]);
});

test('nega rotas de pedidos e a API de compras sem sessão', async ({ page }) => {
  for (const path of ['/payment', '/payment/confirmation', '/activity']) {
    await page.goto(path);
    await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible();
    await expect(page).toHaveURL(/redirect=/);
  }
  const statuses = await page.evaluate(async () =>
    Promise.all([
      fetch('/api/orders').then((response) => response.status),
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }).then((response) => response.status),
    ])
  );
  expect(statuses).toEqual([401, 401]);
});
