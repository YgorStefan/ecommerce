// create-product.dto.ts
// DTO para criação de um produto com validação de campos

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MinLength,
  Min,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  // Nome do produto — obrigatório
  @ApiProperty({
    example: 'Camiseta Básica Branca',
    description: 'Nome do produto',
  })
  @IsString()
  @MinLength(2)
  name: string;

  // Descrição do produto — obrigatória
  @ApiProperty({ description: 'Descrição detalhada do produto' })
  @IsString()
  @MinLength(10)
  description: string;

  // Preço de venda — obrigatório, deve ser positivo
  @ApiProperty({ example: 49.99, description: 'Preço de venda' })
  @IsNumber()
  @Min(0.01, { message: 'Preço deve ser maior que zero' })
  price: number;

  // Preço original (para mostrar desconto) — opcional
  @ApiProperty({
    example: 69.99,
    description: 'Preço original',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  // Quantidade em estoque — deve ser não-negativo
  @ApiProperty({ example: 100, description: 'Quantidade em estoque' })
  @IsNumber()
  @Min(0)
  stock: number;

  // Código SKU — opcional mas deve ser único
  @ApiProperty({
    example: 'CAM-BR-M',
    description: 'Código SKU',
    required: false,
  })
  @IsOptional()
  @IsString()
  sku?: string;

  // URL da imagem principal — opcional (pode ser enviada após criar)
  @ApiProperty({ description: 'URL da imagem principal', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  // Indica se o produto está em destaque
  @ApiProperty({ description: 'Produto em destaque', required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  // Peso em gramas para cálculo de frete
  @ApiProperty({ example: 200, description: 'Peso em gramas', required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  // ID da categoria do produto
  @ApiProperty({ description: 'ID da categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
