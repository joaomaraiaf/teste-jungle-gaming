import { expect, test } from '@playwright/test';
import { loginInDialog } from './helpers/auth';

test('mostra os detalhes mobile e permite favoritar, escolher edição e adicionar ao carrinho', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto('/market/nft-001');
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegação inferior' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toHaveText(
    'Comprar NFT'
  );
  const favorite = page.getByRole('button', { name: 'Adicionar aos favoritos', exact: true });
  await favorite.click();
  await loginInDialog(page);
  await favorite.click();
  await expect(
    page.getByRole('button', { name: 'Remover dos favoritos', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  const editions = page.getByRole('group', { name: 'Edição', exact: true });
  await editions.getByRole('button', { name: '1/50', exact: true }).click();
  await expect(editions.getByRole('button', { name: '1/50', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(page.getByLabel('Quantidade', { exact: true })).toContainText('2');
  await page.getByRole('button', { name: 'Diminuir quantidade' }).click();
  await page.screenshot({ path: '/tmp/nft-mobile-414.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click();
  await expect(page).toHaveURL(/\/market\/nft-001$/);
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
});
