import { type Page, expect, test } from '@playwright/test';
import { loginDemo } from './helpers/auth';
import { openPreparedCheckout } from './helpers/checkout';

async function stable(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-transport-ready', 'true');
  for (const close of (
    await page.locator('[data-sonner-toast] [data-close-button]').all()
  ).reverse())
    await close.click();
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Reduced motion reveals editorial sections; request all full-page assets before capture.
    for (const image of document.images) image.loading = 'eager';
    await Promise.all(
      Array.from(document.images).map((image) => image.decode().catch(() => undefined))
    );
  });
  await expect(page.locator('[data-slot=skeleton]')).toHaveCount(0);
  await expect(page.locator('[aria-busy=true]')).toHaveCount(0);
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date('2026-10-16T12:00:00Z'));
});
test('início', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#catalogo article:has(a[href^="/market/"])')).toHaveCount(9);
  await stable(page);
  await expect(page).toHaveScreenshot('inicio.png', { fullPage: true });
});
test('detalhe', async ({ page }) => {
  await page.goto('/market/nft-001');
  await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toBeVisible();
  await stable(page);
  await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true });
});
test('carrinho', async ({ page }) => {
  await loginDemo(page);
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toBeVisible();
  await stable(page);
  await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true });
});
test('pagamento', async ({ page }) => {
  await loginDemo(page);
  await openPreparedCheckout(page, (page.viewportSize()?.width ?? 1440) < 768);
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeEnabled();
  await stable(page);
  await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true });
});
