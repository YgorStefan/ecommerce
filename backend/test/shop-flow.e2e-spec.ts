import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { createTestApp, uniqueEmail } from './utils/test-app';
import { Product } from '../src/modules/products/entities/product.entity';
import { Category } from '../src/modules/categories/entities/category.entity';
import { Coupon, DiscountType } from '../src/modules/coupons/entities/coupon.entity';

describe('Fluxo completo de compra (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let productsRepo: Repository<Product>;
  let categoriesRepo: Repository<Category>;
  let couponsRepo: Repository<Coupon>;

  let product: Product;
  let coupon: Coupon;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    productsRepo = app.get(getRepositoryToken(Product), { strict: false });
    categoriesRepo = app.get(getRepositoryToken(Category), { strict: false });
    couponsRepo = app.get(getRepositoryToken(Coupon), { strict: false });

    // Seed direto no banco — o objetivo do teste é validar o fluxo de compra do
    // cliente, não a criação de catálogo (já coberta pelos testes de admin)
    const category = await categoriesRepo.save(
      categoriesRepo.create({
        name: `Categoria E2E ${Date.now()}`,
        slug: `categoria-e2e-${Date.now()}`,
        isActive: true,
      }),
    );

    product = await productsRepo.save(
      productsRepo.create({
        name: `Produto E2E ${Date.now()}`,
        slug: `produto-e2e-${Date.now()}`,
        description: 'Produto usado no teste e2e de compra',
        price: 100,
        stock: 10,
        isActive: true,
        categoryId: category.id,
      }),
    );

    coupon = await couponsRepo.save(
      couponsRepo.create({
        code: `E2E10-${Date.now()}`,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        isActive: true,
        usageLimit: 5,
        usageCount: 0,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve executar o fluxo: cadastro → listar produto → carrinho → cupom → checkout PIX → pedido', async () => {
    const agent = request.agent(server);
    const email = uniqueEmail('compra');

    // 1. Cadastro
    await agent.post('/api/auth/register').send({ name: 'Comprador E2E', email, password: 'senhaForte123' }).expect(201);

    // 2. Produto aparece na listagem pública
    const listRes = await request(server).get('/api/products').query({ search: product.name }).expect(200);
    expect(listRes.body.data.products.some((p: any) => p.id === product.id)).toBe(true);

    // 3. Adiciona ao carrinho
    const addRes = await agent
      .post('/api/cart/items')
      .send({ productId: product.id, quantity: 2 })
      .expect(201);
    expect(addRes.body.data.itemCount).toBe(2);

    // 4. Valida o cupom para o subtotal atual (200)
    const couponRes = await agent
      .post('/api/coupons/validate')
      .send({ code: coupon.code, orderSubtotal: 200 })
      .expect(201);
    expect(couponRes.body.data.code).toBe(coupon.code.toUpperCase());

    // 5. Finaliza o pedido via boleto (fluxo simulado, não depende do Stripe,
    // e sem o desconto adicional automático que o PIX aplica)
    const orderRes = await agent
      .post('/api/orders')
      .send({
        paymentMethod: 'boleto',
        shippingAddress: {
          name: 'Comprador E2E',
          address: 'Rua Teste, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310100',
          phone: '11999999999',
        },
        couponCode: coupon.code,
      })
      .expect(201);

    const order = orderRes.body.data.order;
    expect(order.orderNumber).toBeDefined();
    // Subtotal 200, desconto de 10% = 20
    expect(Number(order.discountAmount)).toBe(20);
    // Boleto não usa Stripe — não deve retornar client_secret
    expect(orderRes.body.data.clientSecret).toBeUndefined();

    // 6. O carrinho deve ter sido esvaziado após o checkout
    const cartRes = await agent.get('/api/cart').expect(200);
    expect(cartRes.body.data.items.length).toBe(0);

    // 7. O pedido aparece no histórico do usuário
    const myOrders = await agent.get('/api/orders/me').expect(200);
    expect(myOrders.body.data.orders.some((o: any) => o.id === order.id)).toBe(true);

    // 8. O estoque do produto foi decrementado
    const updatedProduct = await productsRepo.findOne({ where: { id: product.id } });
    expect(updatedProduct?.stock).toBe(8);
  });

  it('não deve permitir finalizar o pedido com carrinho vazio', async () => {
    const agent = request.agent(server);
    const email = uniqueEmail('carrinho-vazio');
    await agent.post('/api/auth/register').send({ name: 'Sem Carrinho', email, password: 'senhaForte123' }).expect(201);

    await agent
      .post('/api/orders')
      .send({
        paymentMethod: 'pix',
        shippingAddress: {
          name: 'X',
          address: 'X',
          city: 'X',
          state: 'SP',
          zipCode: '01310100',
          phone: '11999999999',
        },
      })
      .expect(400);
  });

  it('não deve permitir adicionar ao carrinho mais unidades do que o estoque disponível', async () => {
    const agent = request.agent(server);
    const email = uniqueEmail('estoque');
    await agent.post('/api/auth/register').send({ name: 'Estoque', email, password: 'senhaForte123' }).expect(201);

    await agent
      .post('/api/cart/items')
      .send({ productId: product.id, quantity: 9999 })
      .expect(400);
  });
});
