import { expect, test } from '@playwright/test';

test('inicia MSW e Socket.IO no build, persiste alterações e permite reset', async ({ page }) => {
  const externalRequests: string[] = [];
  const applicationOrigin = new URL(test.info().project.use.baseURL ?? 'http://127.0.0.1:3002')
    .origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== applicationOrigin) externalRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-transport-ready', 'true');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /OWN THE FUTURE OF DIGITAL ART|SEJA DONO DA CULTURA DIGITAL/,
    })
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch('/api/__mock/status');
        return (await response.json()).connections;
      })
    )
    .toBe(1);
  const worker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.scriptURL;
  });
  expect(worker).toContain('/mockServiceWorker.js');
  const initial = await page.evaluate(async () => (await fetch('/api/nfts/nft-001')).json());
  expect(initial.editions[0].priceEth).toBe('1.19');
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/nfts/nft-001', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editionId: 'standard', priceEth: '0.123456789012345678' }),
    });
    if (!response.ok) throw new Error('A atualização simulada falhou.');
  });
  await page.reload();
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /OWN THE FUTURE OF DIGITAL ART|SEJA DONO DA CULTURA DIGITAL/,
    })
  ).toBeVisible();
  const persisted = await page.evaluate(async () => (await fetch('/api/nfts/nft-001')).json());
  expect(persisted.editions[0].priceEth).toBe('0.123456789012345678');
  await page.evaluate(async () => {
    await fetch('/api/__mock/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  });
  const reset = await page.evaluate(async () => (await fetch('/api/nfts/nft-001')).json());
  expect(reset.version).toBe(1);
  expect(reset.editions[0].priceEth).toBe('1.19');
  expect(externalRequests).toEqual([]);
});
