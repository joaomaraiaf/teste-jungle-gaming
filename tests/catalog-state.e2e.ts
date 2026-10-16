import { expect, test } from '@playwright/test';
import { networkRules, releaseNetwork, resetMocks } from './helpers/network';

test('combina filtros, ordena e restaura URL, busca e aba pelo histórico', async ({ page }) => {
  await page.goto('/?page=2&sort=name-asc');
  const catalog = page.getByRole('region', { name: 'Catálogo de NFTs', exact: true });
  await expect(catalog.locator('article:has(a[href^="/market/"])')).toHaveCount(9);
  await page.getByRole('combobox', { name: 'Ordenar por' }).selectOption('price-asc');
  await expect(page).toHaveURL(/page=1/);
  const firstUrl = page.url();
  if ((page.viewportSize()?.width ?? 1440) < 1024)
    await page.getByRole('button', { name: /Filtros/ }).click();
  await page
    .getByRole('button', { name: /^Digital Art/ })
    .filter({ visible: true })
    .click();
  await page
    .getByRole('button', { name: /^Ethereum/ })
    .filter({ visible: true })
    .click();
  if ((page.viewportSize()?.width ?? 1440) < 1024) await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/category=art/);
  await expect(page).toHaveURL(/network=ethereum/);
  if ((page.viewportSize()?.width ?? 1440) >= 1024)
    await page.getByRole('button', { name: 'Abrir busca' }).click();
  await page
    .getByRole('textbox', { name: 'Buscar NFTs por nome ou artista' })
    .filter({ visible: true })
    .fill('Emerald');
  await expect(page).toHaveURL(/search=Emerald/);
  await expect(catalog.locator('article:has(a[href^="/market/"])')).toHaveCount(1);
  const filteredUrl = page.url();
  await page.reload();
  if ((page.viewportSize()?.width ?? 1440) >= 1024)
    await page.getByRole('button', { name: 'Abrir busca' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Buscar NFTs por nome ou artista' }).filter({ visible: true })
  ).toHaveValue('Emerald');
  await expect(page.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('price-asc');
  await page.getByRole('tab', { name: 'Em alta' }).click();
  await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true');
  await page.goBack();
  await expect(page).toHaveURL(filteredUrl);
  await page
    .getByRole('textbox', { name: 'Buscar NFTs por nome ou artista' })
    .filter({ visible: true })
    .fill('rascunho');
  await page.goBack();
  await expect(page).not.toHaveURL(/rascunho/);
  await page.goForward();
  await expect(page).toHaveURL(filteredUrl);
  await expect(
    page.getByRole('textbox', { name: 'Buscar NFTs por nome ou artista' }).filter({ visible: true })
  ).toHaveValue('Emerald');
  await page.goto(firstUrl);
  await page.getByRole('tab', { name: 'Novos lançamentos' }).click();
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Novos lançamentos' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});

test('descarta busca atrasada sem apagar os resultados novos e sinaliza atualização', async ({
  page,
}) => {
  await page.goto('/');
  const catalog = page.getByRole('region', { name: 'Catálogo de NFTs', exact: true });
  await expect(catalog.locator('article:has(a[href^="/market/"])')).toHaveCount(9);
  await networkRules(page, [
    { path: '/nfts', search: 'Emerald', delayMs: 1400 },
    { path: '/nfts', search: 'GreenMint', delayMs: 30 },
  ]);
  const oldRequest = page.waitForRequest(
    (request) =>
      request.url().includes('/api/nfts?') &&
      new URL(request.url()).searchParams.get('search') === 'Emerald'
  );
  if ((page.viewportSize()?.width ?? 1440) >= 1024)
    await page.getByRole('button', { name: 'Abrir busca' }).click();
  const input = page
    .getByRole('textbox', { name: 'Buscar NFTs por nome ou artista' })
    .filter({ visible: true });
  await input.fill('Emerald');
  const cancelled = await oldRequest;
  await expect(catalog.getByRole('status').filter({ hasText: 'Atualizando catálogo' })).toHaveText(
    'Atualizando catálogo…'
  );
  await expect(catalog.locator('article:has(a[href^="/market/"])')).toHaveCount(9);
  await input.fill('GreenMint');
  await expect(catalog.locator('article:has(a[href^="/market/"])')).toHaveCount(9);
  await expect(catalog.getByRole('link', { name: /Ver GreenMint/ }).first()).toBeVisible();
  await expect(catalog.getByRole('link', { name: /Ver Emerald/ })).toHaveCount(0);
  await expect.poll(() => cancelled.failure()?.errorText ?? '').toMatch(/ABORTED|CANCEL|FAILED/i);
});

test('mostra shimmer com movimento reduzido e recupera erro e resultado vazio', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#catalogo article:has(a[href^="/market/"])')).toHaveCount(9);
  await resetMocks(page, 'slow');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const skeleton = page.locator('#catalogo [data-slot=skeleton]').first();
  await expect(skeleton).toBeVisible();
  expect(await skeleton.evaluate((el) => getComputedStyle(el, '::after').animationName)).toBe(
    'none'
  );
  await expect(page.locator('#catalogo article:has(a[href^="/market/"])')).toHaveCount(9);
  await resetMocks(page, 'server-error');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Não foi possível carregar o catálogo' })
  ).toBeVisible({ timeout: 15000 });
  await resetMocks(page);
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.locator('#catalogo article:has(a[href^="/market/"])')).toHaveCount(9);
  await resetMocks(page, 'empty');
  await page.reload();
  await expect(page.locator('#catalogo article:has(a[href^="/market/"])')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Limpar filtros', exact: true })).toBeVisible();
});

test('detalhe e resumo do carrinho usam shimmer e recuperam falhas de consulta', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: 'Ver Emerald Ape #042 1.19 ETH', exact: true })
  ).toBeVisible();
  await networkRules(page, [{ path: '/nfts/nft-001', gate: 'detail', times: 10 }]);
  await page.getByRole('link', { name: 'Ver Emerald Ape #042 1.19 ETH', exact: true }).click();
  await expect(page.locator('[data-slot=skeleton]').first()).toBeVisible();
  await releaseNetwork(page, 'detail');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toBeVisible();
  await networkRules(page, [{ path: '/cart', gate: 'cart', times: 10 }]);
  await page.reload();
  await expect(
    page.getByRole('status', { name: 'Carregando carrinho', exact: true })
  ).toBeVisible();
  await expect(page.locator('[aria-label="Resumo do carrinho"] [data-slot=skeleton]')).toHaveCount(
    3
  );
  await releaseNetwork(page, 'cart');
  await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toBeVisible();
  await networkRules(page, [{ path: '/cart', status: 503, times: 3 }]);
  await page.reload();
  await expect(
    page
      .getByRole('alert', { name: '' })
      .filter({ hasText: 'Não foi possível carregar o carrinho.' })
  ).toBeVisible();
  await networkRules(page, []);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toBeVisible();
});

test('abas respondem às setas e preservam seleção após refresh', async ({ page }) => {
  await page.goto('/');
  const first = page.getByRole('tab', { name: 'Todos os NFTs', exact: true });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Novos lançamentos' })).toBeFocused();
  await expect(page).toHaveURL(/tab=new/);
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Em alta' })).toBeFocused();
  await expect(page).toHaveURL(/sort=price-desc/);
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true');
});
