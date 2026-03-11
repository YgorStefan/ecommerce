// coupon.entity.ts
// Define a entidade Coupon (cupom de desconto)

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

// Enum para o tipo de desconto do cupom
export enum DiscountType {
  PERCENTAGE = 'percentage', // Desconto em percentual (ex: 10%)
  FIXED = 'fixed',           // Desconto em valor fixo (ex: R$ 20,00)
}

@Entity('coupons')
export class Coupon {
  // Identificador único do cupom
  @ApiProperty({ description: 'ID do cupom' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Código do cupom que o cliente digita no checkout
  @ApiProperty({ description: 'Código do cupom (ex: DESCONTO10)' })
  @Column({ unique: true, length: 50, transformer: {
    to: (value: string) => value?.toUpperCase(), // Salva sempre em maiúsculas
    from: (value: string) => value,
  }})
  code: string;

  // Descrição interna do cupom para o admin
  @ApiProperty({ description: 'Descrição do cupom', required: false })
  @Column({ nullable: true, type: 'text' })
  description: string;

  // Tipo do desconto: percentual ou valor fixo
  @ApiProperty({ enum: DiscountType, description: 'Tipo de desconto' })
  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  // Valor do desconto (percentual ou valor em reais)
  @ApiProperty({ description: 'Valor do desconto' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  // Valor mínimo do pedido para usar o cupom
  @ApiProperty({ description: 'Valor mínimo do pedido', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumOrderValue: number;

  // Limite máximo de desconto para cupons percentuais
  @ApiProperty({ description: 'Desconto máximo em reais', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumDiscount: number;

  // Data de início da validade do cupom
  @ApiProperty({ description: 'Data de início da validade', required: false })
  @Column({ nullable: true })
  validFrom: Date;

  // Data de expiração do cupom
  @ApiProperty({ description: 'Data de expiração', required: false })
  @Column({ nullable: true })
  validUntil: Date;

  // Número máximo de vezes que o cupom pode ser usado (null = ilimitado)
  @ApiProperty({ description: 'Limite de uso total', required: false })
  @Column({ nullable: true })
  usageLimit: number;

  // Contador de quantas vezes o cupom foi usado
  @ApiProperty({ description: 'Número de vezes que o cupom foi usado' })
  @Column({ default: 0 })
  usageCount: number;

  // Indica se o cupom está ativo
  @ApiProperty({ description: 'Indica se o cupom está ativo' })
  @Column({ default: true })
  isActive: boolean;

  // Data de criação
  @CreateDateColumn()
  createdAt: Date;

  // Data de atualização
  @UpdateDateColumn()
  updatedAt: Date;
}
