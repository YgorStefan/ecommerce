import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import axios from 'axios';

const seed = JSON.parse(readFileSync(path.join(__dirname, '.seed.json'), 'utf-8'));

const API_URL = 'http://localhost:3901/api';

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@teste.com`;
}

// Cria um pedido pronto via API (fora da UI) apenas para dar ao admin algo para
// gerenciar — o fluxo de checkout em si já é coberto pelo purchase.spec.ts
async function seedOrderForAdmin(): Promise<string> {
  const email = uniqueEmail('pw-admin-cliente');
  const client = axios.create({ baseURL: API_URL, withCredentials: false });

  const registerRes = await client.post('/auth/register', {
    name: 'Cliente do Admin',
    email,
    password: 'senhaForte123',
  });
  const cookies = (registerRes.headers['set-cookie'] || []).join('; ');

  const productRes = await client.get(`/products/${seed.productSlug}`, {
    headers: { Cookie: cookies },
  });
  const productId = productRes.data.data.id;

  await client.post(
    '/cart/items',
    { productId, quantity: 1 },
    { headers: { Cookie: cookies } },
  );

  const orderRes = await client.post(
    '/orders',
    {
      paymentMethod: 'boleto',
      shippingAddress: {
        name: 'Cliente do Admin',
        address: 'Rua Admin, 1',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310100',
        phone: '11999999999',
      },
    },
    { headers: { Cookie: cookies } },
  );

  return orderRes.data.data.order.orderNumber;
}

test.describe('Painel administrativo', () => {
  test('admin faz login, cria um produto e atualiza o status de um pedido', async ({ page }) => {
    const orderNumber = await seedOrderForAdmin();

    // Login como admin
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(seed.adminEmail);
    await page.getByLabel('Senha', { exact: true }).fill(seed.adminPassword);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('/');

    // Dashboard carrega métricas
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: /Dashboard|Painel/i })).toBeVisible();

    // Cria um novo produto pelo painel
    await page.goto('/admin/products');
    await page.getByRole('button', { name: 'Novo Produto' }).click();

    const newProductName = `Produto Admin Playwright ${Date.now()}`;
    await page.getByLabel('Nome *').fill(newProductName);
    await page.getByLabel('Descrição *').fill('Produto criado pelo teste e2e do painel admin');
    await page.getByLabel('Preço de Venda (R$) *').fill('49.90');
    await page.getByLabel('Estoque *').fill('20');
    await page.getByRole('button', { name: 'Criar' }).click();

    await expect(page.getByText('Produto criado com sucesso!')).toBeVisible();
    await expect(page.getByText(newProductName)).toBeVisible();

    // Atualiza o status do pedido semeado (pending -> processing)
    await page.goto('/admin/orders');
    await page.getByText(orderNumber).click();
    await page.getByRole('button', { name: 'Iniciar Processamento' }).click();
    await expect(page.getByText('Status atualizado com sucesso!')).toBeVisible();
  });
});
