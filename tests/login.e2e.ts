import { expect, test } from '@playwright/test';

test('abre o login pelos acessos de conta sem perder a rota e devolve o foco ao fechar', async ({
  page,
}, testInfo) => {
  const routes = testInfo.project.name === 'mobile' ? ['/'] : ['/', '/market/nft-001', '/cart'];
  for (const route of routes) {
    await page.goto(route);
    const trigger = page.getByRole('button', { name: /^Entrar(?: na conta)?$/ });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Entrar', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'E-mail', exact: true })).toBeFocused();
    const bounds = await dialog.boundingBox();
    const viewport = page.viewportSize();
    if (bounds && viewport) {
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(new URL(page.url()).pathname).toBe(route);
  }
});

test('valida o formulário, alterna a senha e limpa os dados ao fechar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Entrar', exact: true });
  await page.screenshot({ path: `/tmp/login-${test.info().project.name}.png`, fullPage: false });
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(dialog.getByText('Informe um e-mail válido.')).toBeVisible();
  await expect(dialog.getByText('Informe sua senha.')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'E-mail', exact: true }).fill('demo@example.com');
  await dialog.getByLabel('Senha', { exact: true }).fill('senha-ficticia');
  await dialog.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(dialog.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await dialog.getByRole('button', { name: 'Ocultar senha' }).click();
  await expect(dialog.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password');
  await dialog.getByRole('button', { name: 'Fechar login' }).click();
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  await expect(dialog.getByLabel('Senha', { exact: true })).toHaveValue('');
  await expect(dialog.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue('');
});

test('abre o cadastro pelo convite, valida as senhas e volta ao login', async ({
  page,
}, testInfo) => {
  const route = testInfo.project.name === 'mobile' ? '/' : '/market/nft-001';
  await page.goto(route);
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  await page.getByRole('button', { name: 'Crie a sua' }).click();
  const signup = page.getByRole('dialog', { name: 'Criar conta', exact: true });
  await expect(signup).toBeVisible();
  await expect(signup.getByRole('textbox', { name: 'Nome de usuário' })).toBeFocused();
  await page.screenshot({ path: `/tmp/signup-${test.info().project.name}.png` });
  await signup.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(signup.getByText('Informe um e-mail válido.')).toBeVisible();
  await signup.getByRole('textbox', { name: 'Nome de usuário' }).fill('Colecionador');
  await signup.getByRole('textbox', { name: 'E-mail', exact: true }).fill('demo@example.com');
  await signup.getByLabel('Senha', { exact: true }).fill('Teste123!');
  await signup.getByLabel('Confirmar senha', { exact: true }).fill('Outra123!');
  await signup.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(signup.getByText('As senhas devem ser iguais.')).toBeVisible();
  await signup.getByRole('button', { name: 'Entrar', exact: true }).click();
  const login = page.getByRole('dialog', { name: 'Entrar', exact: true });
  await expect(login).toBeVisible();
  await expect(login.getByLabel('Senha', { exact: true })).toHaveValue('');
  await login.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(signup.getByLabel('Senha', { exact: true })).toHaveValue('');
  await signup.getByRole('button', { name: 'Fechar cadastro' }).click();
  await expect(signup).not.toBeVisible();
  await expect.poll(() => new URL(page.url()).pathname).toBe(route);
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  await expect(login).toBeVisible();
});

test('cria uma conta, sai, entra novamente e recupera a sessão após refresh', async ({
  page,
}, testInfo) => {
  await page.goto('/market/nft-001');
  await expect(page.locator('html')).toHaveAttribute('data-transport-ready', 'true');
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  if (testInfo.project.name === 'mobile')
    await page.getByRole('link', { name: 'Voltar para o início', exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  await page.getByRole('button', { name: 'Crie a sua' }).click();
  const signup = page.getByRole('dialog', { name: 'Criar conta', exact: true });
  await signup.getByRole('textbox', { name: 'Nome de usuário' }).fill('Colecionador');
  await signup.getByRole('textbox', { name: 'E-mail', exact: true }).fill('demo@example.com');
  await signup.getByLabel('Senha', { exact: true }).fill('Teste123!');
  await signup.getByLabel('Confirmar senha', { exact: true }).fill('Teste123!');
  await signup.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(signup).not.toBeVisible();
  const accountButton = page.getByRole('button', { name: 'Conta de Colecionador' });
  await expect(accountButton).toBeVisible();
  await page.screenshot({ path: `/tmp/account-signed-in-${test.info().project.name}.png` });
  await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible();
  await accountButton.click();
  await page.getByRole('menuitem', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Entrar(?: na conta)?$/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Carrinho, 0 itens' })).toBeVisible();
  await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
  const login = page.getByRole('dialog', { name: 'Entrar', exact: true });
  await login.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await signup.getByRole('textbox', { name: 'Nome de usuário' }).fill('Outro');
  await signup.getByRole('textbox', { name: 'E-mail', exact: true }).fill('demo@example.com');
  await signup.getByLabel('Senha', { exact: true }).fill('Teste123!');
  await signup.getByLabel('Confirmar senha', { exact: true }).fill('Teste123!');
  await signup.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(signup.getByRole('alert')).toHaveText('Já existe uma conta com este e-mail.');
  await signup.getByRole('button', { name: 'Entrar', exact: true }).click();
  await login.getByRole('textbox', { name: 'E-mail', exact: true }).fill('DEMO@EXAMPLE.COM');
  await login.getByLabel('Senha', { exact: true }).fill('Errada123!');
  await login.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(login.getByRole('alert')).toHaveText('E-mail ou senha incorretos.');
  await login.getByLabel('Senha', { exact: true }).fill('Teste123!');
  await login.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(accountButton).toBeVisible();
  await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible();
  await page.reload();
  await expect(accountButton).toBeVisible();
  await accountButton.click();
  await expect(page.getByText('demo@example.com', { exact: true })).toBeVisible();
  await page.getByRole('menuitem', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Entrar(?: na conta)?$/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /^Entrar(?: na conta)?$/ })).toBeEnabled();
});

test('permite entrar nas duas contas de demonstração sem cadastro prévio', async ({ page }) => {
  await page.goto('/');
  for (const account of [
    { email: 'alice@kurio.test', username: 'AliceDemo' },
    { email: 'bruno@kurio.test', username: 'BrunoDemo' },
  ]) {
    await page.getByRole('button', { name: /^Entrar(?: na conta)?$/ }).click();
    const login = page.getByRole('dialog', { name: 'Entrar', exact: true });
    await login.getByRole('textbox', { name: 'E-mail', exact: true }).fill(account.email);
    await login.getByLabel('Senha', { exact: true }).fill('Kurio123!');
    await login.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(login).not.toBeVisible();
    await page.getByRole('button', { name: `Conta de ${account.username}` }).click();
    await page.getByRole('menuitem', { name: 'Sair', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Entrar(?: na conta)?$/ })).toBeEnabled();
  }
});
