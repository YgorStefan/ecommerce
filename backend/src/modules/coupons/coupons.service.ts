// coupons.service.ts
// Serviço que gerencia criação, validação e aplicação de cupons de desconto

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, DiscountType } from './entities/coupon.entity';
import { CreateCouponDto, UpdateCouponDto } from './dto/create-coupon.dto';

export { CreateCouponDto, UpdateCouponDto };

@Injectable()
export class CouponsService {
  constructor(
    // Repositório TypeORM para operações na tabela coupons
    @InjectRepository(Coupon)
    private couponsRepository: Repository<Coupon>,
  ) {}

  // Cria um novo cupom de desconto
  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const coupon = this.couponsRepository.create(createCouponDto);
    return this.couponsRepository.save(coupon);
  }

  // Lista todos os cupons (para o painel admin)
  async findAll(): Promise<Coupon[]> {
    return this.couponsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Busca um cupom pelo ID
  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }
    return coupon;
  }

  // Valida um cupom e retorna o objeto se for válido
  async validate(code: string, orderSubtotal: number): Promise<Coupon> {
    // Busca o cupom pelo código (converte para maiúsculas para padronizar)
    const coupon = await this.couponsRepository.findOne({
      where: { code: code.toUpperCase(), isActive: true },
    });

    if (!coupon) {
      throw new BadRequestException('Cupom inválido ou inativo');
    }

    const now = new Date();

    // Verifica se o cupom ainda não começou a valer
    if (coupon.validFrom && now < coupon.validFrom) {
      throw new BadRequestException('Este cupom ainda não está disponível');
    }

    // Verifica se o cupom expirou
    if (coupon.validUntil && now > coupon.validUntil) {
      throw new BadRequestException('Este cupom expirou');
    }

    // Verifica se o limite de uso foi atingido
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Este cupom atingiu o limite de uso');
    }

    // Verifica o valor mínimo do pedido para usar o cupom
    if (coupon.minimumOrderValue && orderSubtotal < coupon.minimumOrderValue) {
      throw new BadRequestException(
        `Valor mínimo do pedido para este cupom: R$ ${coupon.minimumOrderValue}`,
      );
    }

    return coupon;
  }

  // Calcula o valor do desconto a ser aplicado
  async calculateDiscount(
    coupon: Coupon,
    orderSubtotal: number,
  ): Promise<number> {
    let discount: number;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      // Calcula o desconto percentual
      discount = (orderSubtotal * Number(coupon.discountValue)) / 100;

      // Aplica o limite máximo de desconto se definido
      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = Number(coupon.maximumDiscount);
      }
    } else {
      // Desconto de valor fixo — não pode ser maior que o subtotal
      discount = Math.min(Number(coupon.discountValue), orderSubtotal);
    }

    // Retorna o desconto com 2 casas decimais
    return Math.round(discount * 100) / 100;
  }

  // Incrementa o contador de uso do cupom após um pedido ser criado
  async incrementUsage(id: string): Promise<void> {
    await this.couponsRepository.increment({ id }, 'usageCount', 1);
  }

  // Atualiza um cupom existente
  async update(id: string, updateDto: UpdateCouponDto): Promise<Coupon> {
    await this.findOne(id); // Verifica se existe
    await this.couponsRepository.update(id, updateDto);
    return this.findOne(id);
  }

  // Remove um cupom do banco
  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponsRepository.remove(coupon);
  }
}
