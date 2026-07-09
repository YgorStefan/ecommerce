import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@teste.com`;
}

test.describe('Autenticação', () => {
  test('cadastro, logout e login', async ({ page }) => {
    const email = uniqueEmail('pw-cadastro');

    await page.goto('/register');
    await page.getByLabel('Nome Completo').fill('Playwright Teste');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill('senhaForte123');
    await page.getByLabel('Confirmar Senha').fill('senhaForte123');
    await page.getByRole('button', { name: 'Criar Conta' }).click();

    // Cadastro bem-sucedido redireciona para a home e mostra o menu do usuário
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: 'Menu do usuário' })).toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'Menu do usuário' }).click();
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();

    // Login novamente com as mesmas credenciais
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill('senhaForte123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: 'Menu do usuário' })).toBeVisible();
  });

  test('bloqueia acesso à área da conta sem autenticação', async ({ page }) => {
    await page.goto('/account');
    // O middleware redireciona para o login preservando o destino original
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test('exibe erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(uniqueEmail('naoexiste'));
    await page.getByLabel('Senha', { exact: true }).fill('senhaErrada123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
