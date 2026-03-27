// DTO para criação e atualização de cupons de desconto

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  Length,
} from 'class-validator';
import { DiscountType } from '../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({
    example: 'DESCONTO10',
    description: 'Código único do cupom (maiúsculas)',
  })
  @IsString()
  @Length(3, 50)
  code: string;

  @ApiProperty({
    example: 'Cupom de 10% de desconto',
    description: 'Descrição interna',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: DiscountType,
    description: 'Tipo de desconto: percentual ou valor fixo',
  })
  @IsEnum(DiscountType, {
    message: 'Tipo de desconto inválido. Use "percentage" ou "fixed"',
  })
  discountType: DiscountType;

  @ApiProperty({ example: 10, description: 'Valor do desconto (% ou R$)' })
  @IsNumber()
  @Min(0.01)
  discountValue: number;

  @ApiProperty({
    example: 50,
    description: 'Valor mínimo do pedido para usar o cupom',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderValue?: number;

  @ApiProperty({
    example: 100,
    description: 'Desconto máximo permitido para cupons percentuais',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscount?: number;

  @ApiProperty({
    example: '2026-01-01',
    description: 'Data de início da validade',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @ApiProperty({
    example: '2026-12-31',
    description: 'Data de expiração do cupom',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  validUntil?: Date;

  @ApiProperty({
    example: 100,
    description: 'Limite de usos do cupom (sem limite se omitido)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({
    example: true,
    description: 'Se o cupom está ativo',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DiscountType, required: false })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  discountValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  validUntil?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
