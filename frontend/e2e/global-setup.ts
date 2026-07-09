// Setup global do Playwright — roda uma única vez, depois que o backend e o
// frontend (webServer) já estão de pé, e antes de qualquer teste.
// Semeia diretamente no banco de dados de teste os dados que os testes de UI
// precisam mas que não têm (e não deveriam ter) um formulário próprio: um
// produto/categoria publicados e um usuário administrador.

import mysql from 'mysql2/promise';
import axios from 'axios';
import { writeFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'ecommerce',
  password: 'ecommerce123',
  database: 'ecommerce_db',
};

const API_URL = 'http://localhost:3901/api';

export default async function globalSetup() {
  const conn = await mysql.createConnection(DB_CONFIG);
  const suffix = Date.now();

  try {
    const categoryId = randomUUID();
    const productId = randomUUID();
    const productSlug = `produto-playwright-${suffix}`;
    const productName = `Produto Playwright ${suffix}`;
    const couponCode = `PLAYWRIGHT${suffix}`;

    await conn.execute(
      `INSERT INTO categories (id, name, slug, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, 1, NOW(), NOW())`,
      [categoryId, `Categoria Playwright ${suffix}`, `categoria-playwright-${suffix}`],
    );

    await conn.execute(
      `INSERT INTO products
        (id, name, slug, description, price, stock, isActive, categoryId, averageRating, reviewCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, 0, 0, NOW(), NOW())`,
      [productId, productName, productSlug, 'Produto usado nos testes E2E do Playwright', 149.9, 100, categoryId],
    );

    await conn.execute(
      `INSERT INTO coupons
        (id, code, discountType, discountValue, isActive, usageCount, createdAt, updatedAt)
       VALUES (?, ?, 'percentage', 15, 1, 0, NOW(), NOW())`,
      [randomUUID(), couponCode],
    );

    // Cria o usuário admin via API (garante que a senha seja hasheada
    // corretamente pelo AuthService) e depois promove seu papel via SQL —
    // não existe (nem deveria existir) um endpoint público para criar admins
    const adminEmail = `admin-playwright-${suffix}@teste.com`;
    const adminPassword = 'senhaForte123';
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Admin Playwright',
      email: adminEmail,
      password: adminPassword,
    });
    await conn.execute(`UPDATE users SET role = 'admin' WHERE email = ?`, [adminEmail]);

    const seed = {
      productSlug,
      productName,
      couponCode,
      adminEmail,
      adminPassword,
    };

    writeFileSync(path.join(__dirname, '.seed.json'), JSON.stringify(seed, null, 2));
  } finally {
    await conn.end();
  }
}
