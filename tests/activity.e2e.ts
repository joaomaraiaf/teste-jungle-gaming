import { expect, test } from '@playwright/test';
import { loginInDialog } from './helpers/auth';
import { checkoutAddress, saveCheckoutWallet } from './helpers/checkout';

test('exibe o histórico vazio e oferece acesso ao catálogo', async ({ page }) => {
  await page.goto('/activity');
  await loginInDialog(page);
  await expect(page.getByRole('heading', { name: 'Atividade', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Você ainda não tem atividades' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Atividade', exact: true })).toHaveAttribute(
    'aria-current',
    'page'
  );
  await page.getByRole('link', { name: 'Explorar NFTs' }).last().click();
  await expect(page.getByRole('heading', { name: 'Você ainda não tem atividades' })).toHaveCount(0);
});

test('mantém a compra na conta após logout e novo login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  await page
    .getByRole('dialog', { name: 'Entrar', exact: true })
    .getByRole('button', { name: 'Crie a sua' })
    .click();
  const signup = page.getByRole('dialog', { name: 'Criar conta', exact: true });
  await signup.getByRole('textbox', { name: 'Nome de usuário' }).fill('Colecionador');
  await signup.getByRole('textbox', { name: 'E-mail', exact: true }).fill('activity@example.com');
  await signup.getByLabel('Senha', { exact: true }).fill('Teste123!');
  await signup.getByLabel('Confirmar senha', { exact: true }).fill('Teste123!');
  await signup.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(signup).not.toBeVisible();
  await page.goto('/market/nft-001');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
  await page.getByRole('textbox', { name: 'Nome de exibição' }).fill('Colecionador');
  await page.getByRole('combobox', { name: 'Rede', exact: true }).click();
  await page.getByRole('option', { name: 'Ethereum', exact: true }).click();
  await page.getByRole('textbox', { name: 'Endereço da carteira' }).fill(checkoutAddress);
  await page.getByRole('combobox', { name: 'Tipo de carteira' }).click();
  await page.getByRole('option', { name: 'MetaMask', exact: true }).click();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('activity@example.com');
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('Colecionador');
  await page.getByRole('textbox', { name: 'Nome do perfil' }).fill('Coleção');
  await saveCheckoutWallet(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page).toHaveURL(/\/payment\/confirmation(?:\?|$)/);
  await page.goto('/activity');
  await expect(page.getByRole('heading', { name: 'Compra concluída' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).not.toHaveURL(/\/activity$/);
  await page.goto('/activity');
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible();
  const login = page.getByRole('dialog', { name: 'Entrar', exact: true });
  await login.getByRole('textbox', { name: 'E-mail' }).fill('activity@example.com');
  await login.getByLabel('Senha', { exact: true }).fill('Teste123!');
  await login.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(login).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compra concluída' })).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible();
});
