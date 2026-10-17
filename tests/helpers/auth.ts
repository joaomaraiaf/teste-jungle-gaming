import { type Page, expect } from '@playwright/test';

export async function loginInDialog(
  page: Page,
  email = 'alice@kurio.test',
  password = 'Kurio123!'
) {
  const dialog = page.getByRole('dialog', { name: 'Entrar', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email);
  await dialog.getByLabel('Senha', { exact: true }).fill(password);
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

export async function loginDemo(page: Page, email = 'alice@kurio.test') {
  await page.goto('/');
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  await loginInDialog(page, email);
}
