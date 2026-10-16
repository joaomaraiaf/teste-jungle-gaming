import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function signup(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Entrar', exact: true });
  await dialog.getByRole('button', { name: 'Crie a sua' }).click();
  const form = page.getByRole('dialog', { name: 'Criar conta', exact: true });
  await form.getByRole('textbox', { name: 'Nome de usuário' }).fill('Colecionador');
  await form.getByRole('textbox', { name: 'E-mail', exact: true }).fill('perfil@example.com');
  await form.getByLabel('Senha', { exact: true }).fill('Teste123!');
  await form.getByLabel('Confirmar senha', { exact: true }).fill('Teste123!');
  await form.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(form).not.toBeVisible();
}

async function openProfile(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  await signup(page);
  await page.getByRole('button', { name: 'Conta de Colecionador' }).click();
  await page.getByRole('menuitem', { name: 'Meu perfil', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
}

test('abre Meu perfil, salva os dados e o avatar e preserva após refresh', async ({ page }) => {
  await openProfile(page);
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nome de usuário' })).toHaveValue('Colecionador');
  await expect(page.locator('footer')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `/tmp/profile-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('textbox', { name: 'Nome de exibição' }).fill('Minha coleção');
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('NovoNome');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('novo@example.com');
  await page.getByRole('textbox', { name: 'Nome ENS' }).fill('minha-colecao');
  await page.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Principal');
  await page.getByLabel('Selecionar avatar').setInputFiles('public/images/payment-thank-you.png');
  await expect(page.getByAltText('Avatar do colecionador')).toBeVisible();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Conta de NovoNome' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveValue(
    'Minha coleção'
  );
  await expect(page.getByRole('textbox', { name: 'Nome ENS' })).toHaveValue('minha-colecao');
  await expect(page.getByAltText('Avatar do colecionador')).toBeVisible();
  await page.getByRole('button', { name: 'Remover', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('Perfil salvo com sucesso.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Nome de usuário' })).toHaveValue('NovoNome');
  await expect(page.getByAltText('Avatar do colecionador')).toHaveCount(0);
  await page.getByRole('complementary').getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/\?/);
  await expect(page.getByRole('button', { name: /^Entrar(?: na conta)?$/ })).toBeVisible();
});

test('pede login para o acesso direto e retoma o perfil após cadastrar', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toHaveCount(0);
  await signup(page);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'perfil@example.com'
  );
});

test('confere a senha atual e permite entrar com a nova senha', async ({ page }) => {
  await openProfile(page);
  await page.getByRole('textbox', { name: 'Nome ENS' }).fill('colecionador');
  await page.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Principal');
  await page.getByLabel('Senha atual', { exact: true }).fill('Errada123!');
  await page.getByLabel('Nova senha', { exact: true }).fill('Nova123!');
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Nova123!');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(
    page.getByText('A senha atual está incorreta.', { exact: true }).first()
  ).toBeVisible();
  await page.getByLabel('Senha atual', { exact: true }).fill('Teste123!');
  await page.getByLabel('Nova senha', { exact: true }).fill('Nova123!');
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Nova123!');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('Perfil salvo com sucesso.', { exact: true })).toBeVisible();
  await page.getByRole('complementary').getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Entrar', exact: true });
  await dialog.getByRole('textbox', { name: 'E-mail', exact: true }).fill('perfil@example.com');
  await dialog.getByLabel('Senha', { exact: true }).fill('Nova123!');
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Conta de Colecionador' })).toBeVisible();
});
