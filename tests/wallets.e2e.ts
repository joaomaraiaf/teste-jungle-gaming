import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const primaryAddress = `0x${'a'.repeat(40)}`;
const secondaryAddress = `0x${'b'.repeat(40)}`;

async function signup(page: Page, username = 'Colecionador', email = 'wallets@example.com') {
  await page
    .getByRole('dialog', { name: 'Entrar', exact: true })
    .getByRole('button', { name: 'Crie a sua' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Criar conta', exact: true });
  await dialog.getByRole('textbox', { name: 'Nome de usuário' }).fill(username);
  await dialog.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email);
  await dialog.getByLabel('Senha', { exact: true }).fill('Teste123!');
  await dialog.getByLabel('Confirmar senha', { exact: true }).fill('Teste123!');
  await dialog.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets$/);
}

async function fillWallet(
  page: Page,
  section: Locator,
  alias: string,
  address: string,
  network: string
) {
  await section.getByRole('textbox', { name: 'Apelido da carteira', exact: true }).fill(alias);
  await section.getByRole('textbox', { name: 'Endereço da carteira', exact: true }).fill(address);
  await section.getByRole('combobox', { name: 'Rede', exact: true }).click();
  await page.getByRole('option', { name: network, exact: true }).click();
  await section.getByRole('combobox', { name: 'Tipo de carteira', exact: true }).click();
  await page.getByRole('option', { name: 'MetaMask', exact: true }).click();
}

test('salva carteiras, vincula a secundária, persiste e permite escolher no pagamento', async ({
  page,
}) => {
  await page.goto('/wallets');
  await signup(page);
  const primary = page.getByRole('region', { name: 'Carteira principal', exact: true });
  const secondary = page.getByRole('region', { name: 'Carteira secundária', exact: true });
  await expect(page.getByRole('link', { name: 'Carteiras', exact: true })).toHaveAttribute(
    'aria-current',
    'page'
  );
  await expect(secondary.getByRole('button', { name: 'Adicionar', exact: true })).toBeDisabled();
  await page.screenshot({ path: `/tmp/wallets-${test.info().project.name}.png`, fullPage: true });
  await fillWallet(page, primary, 'Principal', '0x123', 'Ethereum');
  await primary.getByRole('button', { name: 'Salvar carteira', exact: true }).click();
  await expect(
    primary.getByText('Informe um endereço 0x seguido de 40 caracteres hexadecimais.')
  ).toBeVisible();
  await primary
    .getByRole('textbox', { name: 'Endereço da carteira', exact: true })
    .fill(primaryAddress);
  await primary.getByRole('button', { name: 'Salvar carteira', exact: true }).click();
  await expect(
    secondary.getByRole('checkbox', { name: 'Igual à carteira principal' })
  ).toBeEnabled();
  await secondary.getByRole('checkbox', { name: 'Igual à carteira principal' }).check();
  await expect(secondary.getByText('Usando a carteira principal como secundária.')).toBeVisible();
  await page.reload();
  await expect(
    primary.getByRole('textbox', { name: 'Endereço da carteira', exact: true })
  ).toHaveValue(primaryAddress);
  await expect(
    secondary.getByRole('checkbox', { name: 'Igual à carteira principal' })
  ).toBeChecked();
  await secondary.getByRole('checkbox', { name: 'Igual à carteira principal' }).uncheck();
  await expect(secondary.getByRole('button', { name: 'Adicionar', exact: true })).toBeEnabled();
  await secondary.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await fillWallet(page, secondary, 'Reserva', secondaryAddress, 'Polygon');
  await secondary.getByRole('button', { name: 'Salvar carteira secundária', exact: true }).click();
  await expect(secondary.getByText(secondaryAddress, { exact: true })).toBeVisible();
  await page.reload();
  await expect(secondary.getByText(secondaryAddress, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);

  await page.getByRole('link', { name: 'Dados do perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();
  await page.getByRole('link', { name: 'Carteiras', exact: true }).click();
  await expect(
    primary.getByRole('textbox', { name: 'Apelido da carteira', exact: true })
  ).toHaveValue('Principal');
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
  if (test.info().project.name === 'mobile') {
    await page.getByRole('radio', { name: 'Secundária · Reserva', exact: true }).check();
    await page.screenshot({ path: '/tmp/payment-mobile-wallets.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.getByRole('button', { name: 'Trocar carteira', exact: true }).click();
  } else {
    await page.getByRole('combobox', { name: 'Usar carteira salva' }).click();
    await page.getByRole('option', { name: 'Secundária · Reserva', exact: true }).click();
  }
  await expect(
    page.getByRole('textbox', { name: 'Endereço da carteira', exact: true })
  ).toHaveValue(secondaryAddress);
  await expect(page.getByRole('combobox', { name: 'Rede', exact: true })).toHaveText('Polygon');
  await expect(page.getByRole('radio', { name: 'MetaMask', exact: true })).toBeChecked();
  if (test.info().project.name === 'mobile') {
    await page.getByRole('radio', { name: 'Principal · Principal', exact: true }).check();
    await page.getByRole('button', { name: 'Trocar carteira', exact: true }).click();
    await page.getByRole('button', { name: 'Fechar', exact: true }).click();
    await page.getByRole('radio', { name: 'Coinbase Wallet', exact: true }).check();
    const acceptUpdatedQuote = page.getByRole('button', {
      name: 'Revisar e aceitar novos valores',
      exact: true,
    });
    await expect(acceptUpdatedQuote).toBeVisible();
    await acceptUpdatedQuote.click();
    await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
    await expect(page).toHaveURL(/\/payment\/confirmation(?:\?|$)/);
    await page.goto('/activity');
    await expect(page.getByRole('heading', { name: 'Compra concluída' })).toHaveCount(1);
    await expect(page.getByText('Coinbase Wallet', { exact: true })).toBeVisible();
  }
});

test('sai da conta e não mostra carteiras de outro usuário', async ({ page }) => {
  await page.goto('/wallets');
  await signup(page);
  const primary = page.getByRole('region', { name: 'Carteira principal', exact: true });
  await fillWallet(page, primary, 'Privada', primaryAddress, 'Ethereum');
  await primary.getByRole('button', { name: 'Salvar carteira', exact: true }).click();
  await expect(primary.getByRole('button', { name: 'Editar', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Conta de Colecionador' }).click();
  await page.getByRole('menuitem', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/\?/);
  await page.goto('/wallets');
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toHaveCount(0);
  await signup(page, 'Segundo', 'segundo@example.com');
  await expect(
    primary.getByRole('textbox', { name: 'Endereço da carteira', exact: true })
  ).toHaveValue('');
  await expect(
    primary.getByRole('textbox', { name: 'Apelido da carteira', exact: true })
  ).toHaveValue('');
  await expect(primary.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'segundo@example.com'
  );
});
