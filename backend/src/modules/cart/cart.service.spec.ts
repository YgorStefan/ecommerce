import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';

describe('CartService', () => {
  let service: CartService;

  const mockCartsRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const mockCartItemsRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const mockProductsRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: mockCartsRepo },
        { provide: getRepositoryToken(CartItem), useValue: mockCartItemsRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductsRepo },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getCart', () => {
    it('deve criar um carrinho vazio (sem quebrar) se o usuário ainda não tiver um', async () => {
      mockCartsRepo.findOne.mockResolvedValue(null);
      mockCartsRepo.create.mockReturnValue({ userId: 'u1' });
      mockCartsRepo.save.mockResolvedValue({ id: 'c1', userId: 'u1' });

      const result = await service.getCart('u1');

      expect(result.items).toEqual([]);
      expect(result.subtotal).toBe(0);
      expect(result.itemCount).toBe(0);
    });

    it('deve calcular subtotal e itemCount corretamente', async () => {
      mockCartsRepo.findOne.mockResolvedValue({
        id: 'c1',
        userId: 'u1',
        items: [
          { quantity: 2, product: { price: 50 } },
          { quantity: 1, product: { price: 30 } },
        ],
      });

      const result = await service.getCart('u1');

      expect(result.subtotal).toBe(130);
      expect(result.itemCount).toBe(3);
    });
  });

  describe('addItem', () => {
    it('deve lançar NotFoundException se o produto não existir', async () => {
      mockProductsRepo.findOne.mockResolvedValue(null);

      await expect(service.addItem('u1', 'p1', 1)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se o estoque for insuficiente', async () => {
      mockProductsRepo.findOne.mockResolvedValue({ id: 'p1', stock: 2 });

      await expect(service.addItem('u1', 'p1', 5)).rejects.toThrow(BadRequestException);
    });

    it('deve somar a quantidade se o item já existir no carrinho', async () => {
      mockProductsRepo.findOne.mockResolvedValue({ id: 'p1', stock: 10 });
      mockCartsRepo.findOne.mockResolvedValue({ id: 'c1', userId: 'u1', items: [] });
      mockCartItemsRepo.findOne.mockResolvedValue({ id: 'ci1', quantity: 2 });

      await service.addItem('u1', 'p1', 3);

      expect(mockCartItemsRepo.update).toHaveBeenCalledWith('ci1', { quantity: 5 });
    });

    it('deve lançar BadRequestException se a soma exceder o estoque', async () => {
      mockProductsRepo.findOne.mockResolvedValue({ id: 'p1', stock: 4 });
      mockCartsRepo.findOne.mockResolvedValue({ id: 'c1', userId: 'u1', items: [] });
      mockCartItemsRepo.findOne.mockResolvedValue({ id: 'ci1', quantity: 2 });

      await expect(service.addItem('u1', 'p1', 3)).rejects.toThrow(BadRequestException);
    });

    it('deve criar um novo item quando o produto ainda não está no carrinho', async () => {
      mockProductsRepo.findOne.mockResolvedValue({ id: 'p1', stock: 10 });
      mockCartsRepo.findOne.mockResolvedValue({ id: 'c1', userId: 'u1', items: [] });
      mockCartItemsRepo.findOne.mockResolvedValue(null);

      await service.addItem('u1', 'p1', 2);

      expect(mockCartItemsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ cartId: 'c1', productId: 'p1', quantity: 2 }),
      );
      expect(mockCartItemsRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('deve lançar NotFoundException se o carrinho não existir', async () => {
      mockCartsRepo.findOne.mockResolvedValue(null);

      await expect(service.updateItem('u1', 'ci1', 2)).rejects.toThrow(NotFoundException);
    });

    it('deve remover o item quando a quantidade for zero', async () => {
      mockCartsRepo.findOne.mockResolvedValue({ id: 'c1', items: [] });
      mockCartItemsRepo.findOne.mockResolvedValue({ id: 'ci1', product: { stock: 10 } });

      await service.updateItem('u1', 'ci1', 0);

      expect(mockCartItemsRepo.remove).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se a nova quantidade exceder o estoque', async () => {
      mockCartsRepo.findOne.mockResolvedValue({ id: 'c1', items: [] });
      mockCartItemsRepo.findOne.mockResolvedValue({ id: 'ci1', product: { stock: 3 } });

      await expect(service.updateItem('u1', 'ci1', 5)).rejects.toThrow(BadRequestException);
    });
  });

  describe('clearCart', () => {
    it('deve remover todos os itens do carrinho do usuário', async () => {
      mockCartsRepo.findOne.mockResolvedValue({ id: 'c1' });

      await service.clearCart('u1');

      expect(mockCartItemsRepo.delete).toHaveBeenCalledWith({ cartId: 'c1' });
    });

    it('não deve lançar erro se o usuário ainda não tiver carrinho', async () => {
      mockCartsRepo.findOne.mockResolvedValue(null);

      await expect(service.clearCart('u1')).resolves.not.toThrow();
      expect(mockCartItemsRepo.delete).not.toHaveBeenCalled();
    });
  });
});
