import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { PaymentMethod } from './entities/order.entity';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      find: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockOrderRepo = { create: jest.fn(), save: jest.fn(), findAndCount: jest.fn() };
  const mockOrderItemRepo = { create: jest.fn(), save: jest.fn() };
  const mockCartService = { getCart: jest.fn(), clearCart: jest.fn() };
  const mockCouponsService = { validate: jest.fn(), calculateDiscount: jest.fn(), incrementUsage: jest.fn() };
  const mockProductsService = { updateStock: jest.fn() };
  const mockEmailService = { sendOrderConfirmation: jest.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
        { provide: CartService, useValue: mockCartService },
        { provide: CouponsService, useValue: mockCouponsService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() should throw an error if cart is empty', async () => {
    mockCartService.getCart.mockResolvedValue({ items: [] });
    // Any user and payload
    await expect(
      service.create({ id: 'user1' } as any, { paymentMethod: PaymentMethod.PIX, shippingAddress: {} as any, notes: '' })
    ).rejects.toThrow(BadRequestException);
    
    // Transacao nem deve começar
    expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('create() should perform checkout transaction successfully', async () => {
    const cart = {
        items: [
            { productId: 'p1', quantity: 2, product: { name: 'P1', price: 100 } }
        ]
    };
    mockCartService.getCart.mockResolvedValue(cart);
    mockQueryRunner.manager.find.mockResolvedValue([{ id: 'p1', stock: 10 }]);
    mockOrderRepo.create.mockReturnValue({ id: 'o1' });
    mockQueryRunner.manager.save.mockResolvedValue({ id: 'o1' });
    
    // Simulate findOne to return the full order
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'o1' } as any);

    const result = await service.create({ id: 'user1' } as any, { paymentMethod: PaymentMethod.CREDIT_CARD, shippingAddress: {} as any });

    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
    expect(result.id).toBe('o1');
  });

  it('create() should throw an error and rollback if stock is missing', async () => {
    const cart = {
        items: [
            { productId: 'p1', quantity: 5, product: { name: 'P1', price: 100 } }
        ]
    };
    mockCartService.getCart.mockResolvedValue(cart);
    // Retorna stock 2 (insuficiente)
    mockQueryRunner.manager.find.mockResolvedValue([{ id: 'p1', stock: 2, name: 'P1' }]);

    await expect(
      service.create({ id: 'user1' } as any, { paymentMethod: PaymentMethod.CREDIT_CARD, shippingAddress: {} as any })
    ).rejects.toThrow(BadRequestException);

    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});
