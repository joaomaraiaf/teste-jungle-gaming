import { expect, test } from '@playwright/test';
import { loginDemo } from './helpers/auth';
import { saveCheckoutWallet } from './helpers/checkout';

test('rotas diretas, compra, refresh do recibo e aviso em outra aba na origem publicada', async ({
  page,
  context,
}, info) => {
  test.setTimeout(60000);
  await page.goto('/market/nft-001');
  await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toBeVisible();
  const worker = await page.request.get('/mockServiceWorker.js');
  expect(worker.ok()).toBe(true);
  expect(worker.headers()['content-type']).toContain('javascript');
  await loginDemo(page);
  for (const path of ['/profile', '/wallets', '/cart', '/payment', '/payment/confirmation']) {
    await page.goto(path);
    await page.reload();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toHaveCount(0);
  }
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: '1/1', exact: true }).click();
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toBeVisible();
  const other = await context.newPage();
  await loginDemo(other, 'bruno@kurio.test');
  await saveCheckoutWallet(other);
  await other.goto('/market/nft-001');
  await other.getByRole('button', { name: '1/1', exact: true }).click();
  await other.getByRole('button', { name: 'Comprar', exact: true }).click();
  await other.getByRole('link', { name: 'Conectar e finalizar' }).click();
  if (info.project.name !== 'mobile') {
    await other.getByRole('combobox', { name: 'Usar carteira salva' }).click();
    await other.getByRole('option', { name: 'Principal · Principal', exact: true }).click();
  }
  await other.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await expect(other).toHaveURL(/\/payment\/confirmation\?orderId=/);
  const receipt = other.url();
  await other.reload();
  await expect(other).toHaveURL(receipt);
  await expect(
    other.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'esgotou' })).toBeVisible();
  await other.close();
});
