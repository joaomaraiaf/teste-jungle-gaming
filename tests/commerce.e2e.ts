import { type Page, expect, test } from '@playwright/test';
import { loginDemo, loginInDialog } from './helpers/auth';
async function logout(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Conta de AliceDemo' }).click();
  await page.getByRole('menuitem', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Entrar(?: na conta)?$/ })).toBeVisible();
}
async function add(page: Page) {
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('button', { name: 'Aplicar', exact: true })).toBeVisible();
}
async function failNext(page: Page, resource: 'favorites' | 'cart') {
  await page.evaluate(async (resource) => {
    await fetch('/api/__mock/commerce/failure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, delayMs: 1000 }),
    });
  }, resource);
}
test('compartilha favoritos entre catálogo e detalhe, persiste e desfaz falhas otimistas', async ({
  page,
}) => {
  await loginDemo(page);
  const favorite = page.getByRole('button', {
    name: 'Adicionar Emerald Ape #042 aos favoritos',
    exact: true,
  });
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await failNext(page, 'favorites');
  await favorite.click();
  const selected = page.getByRole('button', {
    name: 'Remover Emerald Ape #042 dos favoritos',
    exact: true,
  });
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await expect(favorite).toBeEnabled();
  await favorite.click();
  await expect(selected).toBeEnabled();
  await page.goto('/market/nft-001');
  await expect(
    page.getByRole('button', { name: 'Remover dos favoritos', exact: true }).first()
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Remover dos favoritos', exact: true }).first()
  ).toHaveAttribute('aria-pressed', 'true');
  await logout(page);
  await loginDemo(page, 'bruno@kurio.test');
  await expect(
    page.getByRole('button', { name: 'Adicionar Emerald Ape #042 aos favoritos', exact: true })
  ).toHaveAttribute('aria-pressed', 'false');
});
test('persiste carrinhos por conta, incorpora visitante e aplica e remove cupons pela API', async ({
  page,
}) => {
  await loginDemo(page);
  await add(page);
  await logout(page);
  await add(page);
  await page.reload();
  await expect(page.getByLabel('Quantidade', { exact: true }).filter({ visible: true })).toHaveText(
    '1'
  );
  await page.getByRole('textbox', { name: 'Código promocional', exact: true }).fill('kurio10');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Cupom KURIO10 aplicado' })
  ).toBeVisible();
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
  await loginInDialog(page);
  await expect(page).toHaveURL(/\/payment$/);
  await page.goto('/cart');
  await expect(page.getByLabel('Quantidade', { exact: true }).filter({ visible: true })).toHaveText(
    '2'
  );
  await expect(
    page.getByRole('status').filter({ hasText: 'Cupom KURIO10 aplicado' })
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Quantidade', { exact: true }).filter({ visible: true })).toHaveText(
    '2'
  );
  for (const code of ['INVALIDO', 'EXPIRADO']) {
    await page.getByRole('textbox', { name: 'Código promocional', exact: true }).fill(code);
    await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Não foi possível aplicar o cupom' })
    ).toBeVisible();
    await expect(
      page.getByRole('status').filter({ hasText: 'Cupom KURIO10 aplicado' })
    ).toBeVisible();
  }
  await page.getByRole('button', { name: 'Remover cupom', exact: true }).click();
  await expect(page.getByText('Cupom KURIO10 aplicado')).not.toBeVisible();
  await page.reload();
  await expect(page.getByText('Cupom KURIO10 aplicado')).not.toBeVisible();
  await logout(page);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  await loginDemo(page, 'bruno@kurio.test');
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});
test('recupera falha de mutation sem remover itens persistidos', async ({ page }) => {
  await add(page);
  await failNext(page, 'cart');
  await page
    .getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho', exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByText('Não foi possível salvar. Tente novamente.', { exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Quantidade', { exact: true }).filter({ visible: true })).toHaveText(
    '1'
  );
});

test('mutation atrasada de Alice não altera os favoritos nem o cache de Bruno', async ({
  page,
}) => {
  await loginDemo(page);
  await page.evaluate(async () => {
    await fetch('/api/__mock/commerce/failure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource: 'favorites', delayMs: 5000, status: 0 }),
    });
  });
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/favorites/nft-001') && response.request().method() !== 'GET'
  );
  await page
    .getByRole('button', { name: 'Adicionar Emerald Ape #042 aos favoritos', exact: true })
    .click();
  // Client-side navigation keeps the in-flight request alive during the identity change.
  await page.getByRole('button', { name: 'Conta de AliceDemo' }).click();
  await page.getByRole('menuitem', { name: 'Sair', exact: true }).click();
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  await loginInDialog(page, 'bruno@kurio.test');
  expect((await response).status()).toBe(401);
  await expect(page.getByRole('button', { name: 'Conta de BrunoDemo' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Adicionar Emerald Ape #042 aos favoritos', exact: true })
  ).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(async () => (await fetch('/api/favorites')).json())).toMatchObject({
    nftIds: [],
  });
});
