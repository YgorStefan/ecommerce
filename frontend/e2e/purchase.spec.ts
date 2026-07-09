import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

const seed = JSON.parse(readFileSync(path.join(__dirname, '.seed.json'), 'utf-8'));

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@teste.com`;
}

test.describe('Fluxo completo de compra', () => {
  test('cadastro → produto → carrinho → cupom → checkout (boleto) → confirmação → histórico', async ({ page }) => {
    const email = uniqueEmail('pw-compra');

    // Cadastro
    await page.goto('/register');
    await page.getByLabel('Nome Completo').fill('Comprador Playwright');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill('senhaForte123');
    await page.getByLabel('Confirmar Senha').fill('senhaForte123');
    await page.getByRole('button', { name: 'Criar Conta' }).click();
    await expect(page).toHaveURL('/');

    // Busca e abre o produto semeado para o teste
    await page.goto(`/products/${seed.productSlug}`);
    await expect(page.getByRole('heading', { name: seed.productName })).toBeVisible();

    // Adiciona ao carrinho — o drawer do carrinho abre automaticamente
    await page.getByRole('button', { name: 'Adicionar ao Carrinho' }).click();

    // Segue para o checkout pelo botão do drawer que já está aberto
    await page.getByRole('link', { name: 'Finalizar Compra' }).click();
    await expect(page).toHaveURL('/checkout');

    // Preenche o endereço de entrega
    await page.getByLabel('Nome completo').fill('Comprador Playwright');
    await page.getByLabel('Endereço').fill('Rua dos Testes, 100');
    await page.getByLabel('Cidade').fill('São Paulo');
    await page.getByLabel('Estado').fill('SP');
    await page.getByLabel('CEP').fill('01310100');
    await page.getByLabel('Telefone').fill('11999999999');

    // Aplica o cupom semeado
    await page.getByPlaceholder('SEUCUPOM').fill(seed.couponCode);
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await expect(page.getByText(seed.couponCode, { exact: false }).first()).toBeVisible();

    // Seleciona boleto (não depende de chaves reais do Stripe)
    await page.getByRole('radio').nth(2).check();

    await page.getByRole('button', { name: /Finalizar Pedido/ }).first().click();

    // Página de confirmação do pedido
    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.getByText('Pedido Confirmado!')).toBeVisible();

    // O pedido aparece no histórico do usuário
    await page.goto('/account/orders');
    await expect(page.getByText(/ORD-/).first()).toBeVisible();
  });

  test('não permite finalizar o pedido com o carrinho vazio', async ({ page }) => {
    const email = uniqueEmail('pw-vazio');

    await page.goto('/register');
    await page.getByLabel('Nome Completo').fill('Sem Carrinho');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill('senhaForte123');
    await page.getByLabel('Confirmar Senha').fill('senhaForte123');
    await page.getByRole('button', { name: 'Criar Conta' }).click();
    await expect(page).toHaveURL('/');

    // Sem itens no carrinho, o checkout redireciona de volta para os produtos
    await page.goto('/checkout');
    await expect(page).toHaveURL('/products');
  });
});
