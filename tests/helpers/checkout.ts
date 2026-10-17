import { expect, type Page } from '@playwright/test';
export const checkoutAddress = `0x${'a'.repeat(40)}`;
export async function saveCheckoutWallet(page: Page) {
  const status = await page.evaluate(
    async (address) =>
      (
        await fetch('/api/wallets/primary', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: 'Colecionador',
            walletAlias: 'Principal',
            network: 'ethereum',
            profileName: 'Minha coleção',
            walletAddress: address,
            secondaryWallet: '',
            walletType: 'metamask',
            referralCode: '',
            email: 'collector@kurio.test',
            ensName: '',
          }),
        })
      ).status,
    checkoutAddress
  );
  expect(status).toBe(200);
}
export async function configureCheckout(
  page: Page,
  config: {
    scenario?: 'confirmed' | 'refused' | 'timeout-after-create';
    resolveAfterMs?: number;
    refuseConnection?: boolean;
  }
) {
  expect(
    await page.evaluate(
      async (config) =>
        (
          await fetch('/api/__mock/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
          })
        ).status,
      config
    )
  ).toBe(204);
}
export async function openPreparedCheckout(page: Page, mobile: boolean) {
  await saveCheckoutWallet(page);
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await page.getByRole('link', { name: 'Conectar e finalizar', exact: true }).click();
  if (!mobile) {
    await page.getByRole('combobox', { name: 'Usar carteira salva' }).click();
    await page.getByRole('option', { name: 'Principal · Principal', exact: true }).click();
  }
  await expect(page.getByRole('radio', { name: 'MetaMask', exact: true })).toBeChecked();
}
