import { expect, test } from '@playwright/test';

for (const path of ['/', '/market/nft-001']) {
  test(`exibe HTML público antes dos módulos e hidrata sem erros: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/assets/*.js', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(path, { waitUntil: 'commit' });
    await expect(page.locator('#root')).toHaveAttribute('data-prerendered', 'true');
    await expect(
      page.getByRole('heading', { name: 'Emerald Ape #042', exact: true }).first()
    ).toBeVisible();
    const refreshed = page.waitForResponse(
      (response) => response.url().includes('/api/nfts') && response.ok()
    );
    release();
    await expect(page.locator('html')).toHaveAttribute('data-transport-ready', 'true');
    await refreshed;
    await expect(
      page.getByRole('heading', { name: 'Emerald Ape #042', exact: true }).first()
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
