import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { loginDemo } from './helpers/auth';
import { openPreparedCheckout } from './helpers/checkout';

async function check(page: Page, label: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label).toBe(
    true
  );
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    ),
    `${label}: ${JSON.stringify(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`
  ).toEqual([]);
}

test('telas obrigatórias sem overflow e sem violações graves de acessibilidade', async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#catalogo article:has(a[href^="/market/"])')).toHaveCount(9);
  await check(page, 'Início');
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible();
  await check(page, 'Login');
  await page.getByRole('button', { name: 'Crie a sua' }).click();
  await expect(page.getByRole('dialog', { name: 'Criar conta', exact: true })).toBeVisible();
  await check(page, 'Cadastro');
  await page.keyboard.press('Escape');
  await loginDemo(page);
  for (const [path, heading] of [
    ['/profile', 'Perfil do colecionador'],
    ['/wallets', 'Carteira principal'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await check(page, path);
  }
  await page.goto('/market/nft-001');
  await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toBeVisible();
  await check(page, 'Detalhe');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toBeVisible();
  await check(page, 'Carrinho');
  await openPreparedCheckout(page, (page.viewportSize()?.width ?? 1440) < 768);
  await check(page, 'Pagamento');
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await expect(page).toHaveURL(/\/payment\/confirmation\?orderId=/);
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
  await check(page, 'Confirmação');
});

test('zoom de texto preserva campos e foco de diálogo', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const login = page.getByRole('button', { name: /^Entrar(?: na conta)?$/ });
  await login.click();
  const dialog = page.getByRole('dialog', { name: 'Entrar', exact: true });
  await expect(dialog).toBeVisible();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('alice@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!');
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(login).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
