import { expect, type Page, test } from '@playwright/test';
import { loginDemo } from './helpers/auth';
import { configureCheckout, saveCheckoutWallet } from './helpers/checkout';

async function add(page: Page, edition = '1/1') {
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: edition, exact: true }).click();
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
}
async function checkout(page: Page, mobile: boolean) {
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
  if (!mobile) {
    await page.getByRole('combobox', { name: 'Usar carteira salva' }).click();
    await page.getByRole('option', { name: 'Principal · Principal', exact: true }).click();
  }
  await expect(page.getByRole('radio', { name: 'MetaMask', exact: true })).toBeChecked();
}
test('compra em outra aba entrega nft.updated e bloqueia a edição esgotada no carrinho', async ({
  page,
  context,
}, info) => {
  await loginDemo(page);
  await add(page);
  const other = await context.newPage();
  await loginDemo(other, 'bruno@kurio.test');
  await saveCheckoutWallet(other);
  await add(other);
  await checkout(other, info.project.name === 'mobile');
  await other.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
  await expect(other).toHaveURL(/\/payment\/confirmation\?orderId=/);
  // No focus/refresh in A: only the simulated socket delivers the notification.
  await expect(page.getByRole('alert').filter({ hasText: 'esgotou' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Conectar e finalizar', exact: true })).toHaveCount(
    0
  );
  await expect(
    page.getByRole('button', { name: 'Conectar e finalizar', exact: true })
  ).toBeDisabled();
  expect(await page.evaluate(async () => (await fetch('/api/orders')).json())).toEqual([]);
  await other.close();
});
test('atualiza disponibilidade sem reduzir quantidade suficiente e ajusta somente quando necessário', async ({
  page,
  context,
}) => {
  await loginDemo(page);
  await add(page, '1/10');
  const other = await context.newPage();
  await loginDemo(other, 'bruno@kurio.test');
  const change = async (available: number) =>
    other.evaluate(async (available) => {
      await fetch('/api/__mock/nfts/nft-001', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editionId: 'standard', available }),
      });
    }, available);
  await change(8);
  await expect(
    page.getByRole('alert').filter({ hasText: 'disponibilidade atualizada para 8' })
  ).toBeVisible();
  await expect(page.getByLabel('Quantidade', { exact: true }).filter({ visible: true })).toHaveText(
    '1'
  );
  await page
    .getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.getByLabel('Quantidade', { exact: true }).filter({ visible: true })).toHaveText(
    '2'
  );
  await change(1);
  await expect(
    page.getByRole('alert').filter({ hasText: 'quantidade ajustada para 1' })
  ).toBeVisible();
  await expect(page.getByLabel('Quantidade', { exact: true }).filter({ visible: true })).toHaveText(
    '1'
  );
  await other.close();
});
test('reconexão reconcilia via REST eventos perdidos enquanto o socket estava fora', async ({
  page,
  context,
}) => {
  await loginDemo(page);
  await add(page, '1/10');
  const other = await context.newPage();
  await loginDemo(other, 'bruno@kurio.test');
  await page.evaluate(async () => {
    await fetch('/api/__mock/socket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected: false }),
    });
  });
  await other.evaluate(async () => {
    await fetch('/api/__mock/nfts/nft-001', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editionId: 'standard', available: 0 }),
    });
  });
  await expect(page.getByRole('alert').filter({ hasText: 'esgotou' })).toHaveCount(0);
  await page.evaluate(async () => {
    await fetch('/api/__mock/socket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected: true }),
    });
  });
  await expect(page.getByRole('alert').filter({ hasText: 'esgotou' })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => (await (await fetch('/api/__mock/status')).json()).connections)
    )
    .toBe(1);
  await other.close();
});
test('duas tentativas concorrentes pela última unidade confirmam somente um pedido', async ({
  page,
  context,
}, info) => {
  await loginDemo(page);
  await saveCheckoutWallet(page);
  await add(page);
  await checkout(page, info.project.name === 'mobile');
  const other = await context.newPage();
  await loginDemo(other, 'bruno@kurio.test');
  await saveCheckoutWallet(other);
  await add(other);
  await checkout(other, info.project.name === 'mobile');
  await configureCheckout(other, { resolveAfterMs: 4000 });
  await Promise.all([
    page.getByRole('button', { name: 'Confirmar compra', exact: true }).click(),
    other.getByRole('button', { name: 'Confirmar compra', exact: true }).click(),
  ]);
  await expect
    .poll(
      async () => {
        const states = await Promise.all(
          [page, other].map((tab) =>
            tab.evaluate(async () =>
              (await (await fetch('/api/orders')).json()).map(
                (order: { status: string }) => order.status
              )
            )
          )
        );
        return states.flat().sort();
      },
      { timeout: 15000 }
    )
    .toEqual(['confirmed', 'rejected']);
  const stocks = await Promise.all(
    [page, other].map((tab) =>
      tab.evaluate(
        async () =>
          (await (await fetch('/api/nfts/nft-001')).json()).editions.find(
            (edition: { id: string }) => edition.id === 'edition-one'
          ).available
      )
    )
  );
  expect(stocks).toEqual([0, 0]);
  await other.close();
});

test('avisa mudança apenas no preço e ignora replays duplicados e antigos pelo socket', async ({
  page,
  context,
}) => {
  await loginDemo(page);
  await add(page, '1/10');
  const other = await context.newPage();
  await loginDemo(other, 'bruno@kurio.test');
  const event = await other.evaluate(async () =>
    (
      await fetch('/api/__mock/nfts/nft-001', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editionId: 'standard', priceEth: '2.19' }),
      })
    ).json()
  );
  const notice = page
    .getByRole('status')
    .filter({ hasText: 'preço atualizado de 1.19 ETH para 2.19 ETH' });
  await expect(notice).toBeVisible();
  await expect(page.getByText('2.206 ETH', { exact: true }).first()).toBeVisible();
  let cartRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/cart' && request.method() === 'GET')
      cartRequests++;
  });
  await page.evaluate(async (event) => {
    for (const payload of [
      event,
      {
        ...event,
        version: 1,
        data: {
          ...event.data,
          version: 1,
          editions: event.data.editions.map((edition: { id: string; priceEth: string }) => ({
            ...edition,
            priceEth: '0.01',
          })),
        },
      },
    ]) {
      await fetch('/api/__mock/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    // A valid later event is a protocol barrier: both replays were delivered before it.
    await fetch('/api/__mock/nfts/nft-002', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editionId: 'standard', available: 6 }),
    });
  }, event);
  await expect.poll(() => cartRequests).toBeGreaterThan(0);
  await expect(notice).toHaveCount(1);
  await expect(page.getByText('2.206 ETH', { exact: true }).first()).toBeVisible();
  await other.close();
});

test('retoma o mesmo pedido pendente após desconexão sem duplicar estoque', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-10-16T12:00:00Z'));
  await loginDemo(page);
  await saveCheckoutWallet(page);
  await add(page);
  await checkout(page, info.project.name === 'mobile');
  await configureCheckout(page, { resolveAfterMs: 60000 });
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).dblclick();
  await expect(
    page.getByText('Pedido pendente. Aguardando confirmação da carteira…')
  ).toBeVisible();
  const pending = await page.evaluate(async () => (await (await fetch('/api/orders')).json())[0]);
  await page.evaluate(async () => {
    await fetch('/api/__mock/socket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected: false }),
    });
  });
  await page.clock.setFixedTime(new Date('2026-10-16T12:02:00Z'));
  await page.evaluate(async () => {
    await fetch('/api/__mock/socket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected: true }),
    });
  });
  await expect(page).toHaveURL(new RegExp(`/payment/confirmation\\?orderId=${pending.id}`));
  const orders = await page.evaluate(async () => (await fetch('/api/orders')).json());
  expect(orders).toHaveLength(1);
  expect(orders[0].id).toBe(pending.id);
  expect(orders[0].status).toBe('confirmed');
  const receipt = orders[0];
  await page.evaluate(
    async (event) => {
      for (const payload of [
        event,
        {
          ...event,
          version: event.version + 1,
          data: {
            ...event.data,
            status: 'pending',
            version: event.version + 1,
            resolveAt: '2026-10-16T12:03:00.000Z',
          },
        },
      ]) {
        await fetch('/api/__mock/replay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    },
    {
      eventId: `order.updated:${receipt.id}:${receipt.version}`,
      type: 'order.updated',
      resourceId: receipt.id,
      userId: receipt.userId,
      version: receipt.version,
      occurredAt: receipt.updatedAt,
      data: receipt,
    }
  );
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
  const nft = await page.evaluate(async () => (await fetch('/api/nfts/nft-001')).json());
  expect(
    nft.editions.find((edition: { id: string }) => edition.id === 'edition-one').available
  ).toBe(0);
});
