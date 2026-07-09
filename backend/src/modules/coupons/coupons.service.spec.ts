import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { Coupon, DiscountType } from './entities/coupon.entity';

describe('CouponsService', () => {
  let service: CouponsService;

  const mockQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockCouponsRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: getRepositoryToken(Coupon), useValue: mockCouponsRepo },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validate', () => {
    it('deve lançar BadRequestException se o cupom não existir ou estiver inativo', async () => {
      mockCouponsRepo.findOne.mockResolvedValue(null);

      await expect(service.validate('INEXISTENTE', 100)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o cupom ainda não começou a valer', async () => {
      mockCouponsRepo.findOne.mockResolvedValue({
        validFrom: new Date(Date.now() + 86400000),
        usageCount: 0,
      });

      await expect(service.validate('FUTURO10', 100)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o cupom estiver expirado', async () => {
      mockCouponsRepo.findOne.mockResolvedValue({
        validUntil: new Date(Date.now() - 86400000),
        usageCount: 0,
      });

      await expect(service.validate('EXPIRADO', 100)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o limite de uso foi atingido', async () => {
      mockCouponsRepo.findOne.mockResolvedValue({ usageLimit: 5, usageCount: 5 });

      await expect(service.validate('ESGOTADO', 100)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o subtotal for menor que o valor mínimo', async () => {
      mockCouponsRepo.findOne.mockResolvedValue({ minimumOrderValue: 200, usageCount: 0 });

      await expect(service.validate('MIN200', 100)).rejects.toThrow(BadRequestException);
    });

    it('deve retornar o cupom se todas as condições forem satisfeitas', async () => {
      const coupon = { code: 'VALIDO10', usageCount: 0 };
      mockCouponsRepo.findOne.mockResolvedValue(coupon);

      const result = await service.validate('valido10', 100);

      expect(result).toBe(coupon);
    });
  });

  describe('calculateDiscount', () => {
    it('deve calcular desconto percentual corretamente', async () => {
      const coupon = { discountType: DiscountType.PERCENTAGE, discountValue: 10 } as Coupon;

      const discount = await service.calculateDiscount(coupon, 200);

      expect(discount).toBe(20);
    });

    it('deve respeitar o desconto máximo em cupons percentuais', async () => {
      const coupon = {
        discountType: DiscountType.PERCENTAGE,
        discountValue: 50,
        maximumDiscount: 30,
      } as Coupon;

      const discount = await service.calculateDiscount(coupon, 200);

      expect(discount).toBe(30);
    });

    it('não deve permitir desconto fixo maior que o subtotal', async () => {
      const coupon = { discountType: DiscountType.FIXED, discountValue: 500 } as Coupon;

      const discount = await service.calculateDiscount(coupon, 100);

      expect(discount).toBe(100);
    });
  });

  describe('incrementUsageIfAllowed', () => {
    it('deve retornar true quando a atualização afeta uma linha', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      const result = await service.incrementUsageIfAllowed('c1');

      expect(result).toBe(true);
    });

    it('deve retornar false quando o limite já foi atingido (nenhuma linha afetada)', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      const result = await service.incrementUsageIfAllowed('c1');

      expect(result).toBe(false);
    });
  });
});
