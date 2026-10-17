import { expect, test } from '@playwright/test';
import { loginDemo } from './helpers/auth';
import { configureCheckout, openPreparedCheckout } from './helpers/checkout';
test.beforeEach(async ({ page }) => {
  await loginDemo(page);
});
test('recusa a conexão da carteira no checkout sem criar pedido', async ({ page }, info) => {
  await openPreparedCheckout(page, info.project.name === 'mobile');
  await configureCheckout(page, { refuseConnection: true });
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await expect(page.getByText('A conexão foi recusada. Tente conectar novamente.')).toBeVisible();
  expect(await page.evaluate(async () => (await fetch('/api/orders')).json())).toEqual([]);
});
test('recupera pedido pendente após refresh e carrega o mesmo comprovante pela API', async ({
  page,
}, info) => {
  await openPreparedCheckout(page, info.project.name === 'mobile');
  await configureCheckout(page, { resolveAfterMs: 4000 });
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).dblclick();
  await expect(
    page.getByText('Pedido pendente. Aguardando confirmação da carteira…')
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Pedido pendente. Aguardando confirmação da carteira…')
  ).toBeVisible();
  await expect(page).toHaveURL(/\/payment\/confirmation\?orderId=/, { timeout: 10000 });
  const url = page.url();
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
  const hash = await page.locator('[title^="0x"]').first().getAttribute('title');
  await page.reload();
  await expect(page).toHaveURL(url);
  await expect(page.locator('[title^="0x"]').first()).toHaveAttribute('title', hash!);
  expect(await page.evaluate(async () => (await (await fetch('/api/orders')).json()).length)).toBe(
    1
  );
});
test('recupera timeout após criação sem reenvio duplicado', async ({ page }, info) => {
  await openPreparedCheckout(page, info.project.name === 'mobile');
  await configureCheckout(page, { scenario: 'timeout-after-create', resolveAfterMs: 2000 });
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/orders') && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  expect((await created).status()).toBe(504);
  await page.reload();
  await expect(page).toHaveURL(/\/payment\/confirmation\?orderId=/, { timeout: 10000 });
  const orders = await page.evaluate(async () => (await fetch('/api/orders')).json());
  expect(orders).toHaveLength(1);
  expect(orders[0].status).toBe('confirmed');
});
test('pagamento recusado preserva itens e permite uma nova tentativa explícita', async ({
  page,
}, info) => {
  await openPreparedCheckout(page, info.project.name === 'mobile');
  await configureCheckout(page, { scenario: 'refused' });
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pedido recusado', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pedido recusado', exact: true })).toBeVisible();
  const count = await page.evaluate(
    async () => (await (await fetch('/api/cart')).json()).items[0].quantity
  );
  expect(count).toBe(1);
  await configureCheckout(page, { scenario: 'confirmed' });
  await page.getByRole('button', { name: 'Revisar e tentar novamente', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await expect(page).toHaveURL(/\/payment\/confirmation\?orderId=/);
  const orders = await page.evaluate(async () => (await fetch('/api/orders')).json());
  expect(orders.map((order: { status: string }) => order.status).sort()).toEqual([
    'confirmed',
    'rejected',
  ]);
});
test('cotação alterada exige aceite explícito antes de enviar novos valores', async ({
  page,
}, info) => {
  await openPreparedCheckout(page, info.project.name === 'mobile');
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeEnabled();
  expect(
    await page.evaluate(
      async () =>
        (
          await fetch('/api/__mock/nfts/nft-001', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ editionId: 'standard', priceEth: '2.19' }),
          })
        ).status
    )
  ).toBe(200);
  await expect(page.getByRole('heading', { name: 'A cotação mudou' })).toBeVisible();
  expect(await page.evaluate(async () => (await fetch('/api/orders')).json())).toEqual([]);
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Revisar e aceitar novos valores', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await expect(page).toHaveURL(/\/payment\/confirmation\?orderId=/);
  await expect(page.getByText('2.206 ETH', { exact: true }).first()).toBeVisible();
});
