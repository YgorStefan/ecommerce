import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProductsRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softRemove: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };
  const mockImagesRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockProductsRepo },
        { provide: getRepositoryToken(ProductImage), useValue: mockImagesRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOne', () => {
    it('deve lançar NotFoundException se o produto não existir', async () => {
      mockProductsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('inexistente')).rejects.toThrow(NotFoundException);
    });

    it('deve retornar o produto quando encontrado', async () => {
      const product = { id: 'p1', name: 'Produto Teste' };
      mockProductsRepo.findOne.mockResolvedValue(product);

      const result = await service.findOne('p1');

      expect(result).toBe(product);
    });
  });

  describe('create', () => {
    it('deve gerar um slug a partir do nome do produto', async () => {
      mockProductsRepo.findOne.mockResolvedValue(null); // Sem conflito de slug
      mockProductsRepo.create.mockImplementation((data) => data);
      mockProductsRepo.save.mockImplementation((data) => Promise.resolve({ ...data, id: 'p1' }));

      const result = await service.create({ name: 'Camiseta Azul' } as any);

      expect(result.slug).toBe('camiseta-azul');
    });

    it('deve adicionar sufixo único se o slug já existir', async () => {
      mockProductsRepo.findOne.mockResolvedValue({ id: 'existing', slug: 'camiseta-azul' });
      mockProductsRepo.create.mockImplementation((data) => data);
      mockProductsRepo.save.mockImplementation((data) => Promise.resolve({ ...data, id: 'p2' }));

      const result = await service.create({ name: 'Camiseta Azul' } as any);

      expect(result.slug).toMatch(/^camiseta-azul-\d+$/);
    });
  });

  describe('update', () => {
    it('deve regenerar o slug quando o nome é alterado', async () => {
      mockProductsRepo.findOne.mockResolvedValue({ id: 'p1', name: 'Nome Antigo', slug: 'nome-antigo' });
      mockProductsRepo.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.update('p1', { name: 'Nome Novo' } as any);

      expect(result.slug).toBe('nome-novo');
    });

    it('não deve alterar o slug se o nome permanecer o mesmo', async () => {
      mockProductsRepo.findOne.mockResolvedValue({ id: 'p1', name: 'Mesmo Nome', slug: 'mesmo-nome' });
      mockProductsRepo.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.update('p1', { name: 'Mesmo Nome', price: 99 } as any);

      expect(result.slug).toBe('mesmo-nome');
    });
  });

  describe('updateStock', () => {
    it('deve lançar BadRequestException se o novo estoque ficar negativo', async () => {
      mockProductsRepo.findOne.mockResolvedValue({ id: 'p1', name: 'Produto', stock: 2 });

      await expect(service.updateStock('p1', 5)).rejects.toThrow(BadRequestException);
    });

    it('deve atualizar o estoque corretamente quando há saldo suficiente', async () => {
      mockProductsRepo.findOne.mockResolvedValue({ id: 'p1', name: 'Produto', stock: 10 });

      await service.updateStock('p1', 4);

      expect(mockProductsRepo.update).toHaveBeenCalledWith('p1', { stock: 6 });
    });
  });
});
