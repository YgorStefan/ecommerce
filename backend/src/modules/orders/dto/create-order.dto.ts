// DTO para criação de um pedido no checkout

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/order.entity';

// DTO para o endereço de entrega do pedido
export class ShippingAddressDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome do destinatário' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Rua das Flores, 123', description: 'Endereço' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'São Paulo', description: 'Cidade' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'SP', description: 'Estado (sigla)' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '01310-100', description: 'CEP' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({ example: '(11) 99999-9999', description: 'Telefone' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

// DTO principal para criação do pedido
export class CreateOrderDto {
  // Método de pagamento escolhido pelo cliente
  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido' })
  paymentMethod: PaymentMethod;

  // Endereço de entrega — objeto aninhado validado pelo ValidateNested
  @ApiProperty({ type: ShippingAddressDto, description: 'Endereço de entrega' })
  @ValidateNested() // Valida recursivamente os campos do DTO aninhado
  @Type(() => ShippingAddressDto) // Transforma o objeto plano em instância da classe
  shippingAddress: ShippingAddressDto;

  // Código do cupom de desconto
  @ApiProperty({
    example: 'DESCONTO10',
    description: 'Código do cupom',
    required: false,
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  // Observações do pedido
  @ApiProperty({ description: 'Observações do pedido', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
