// query-product.dto.ts
// DTO para os parâmetros de busca e filtragem de produtos

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsUUID, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// Enum para as opções de ordenação de produtos
export enum ProductSortBy {
  PRICE_ASC = 'price_asc',         // Menor preço primeiro
  PRICE_DESC = 'price_desc',       // Maior preço primeiro
  NAME_ASC = 'name_asc',           // Ordem alfabética A-Z
  NAME_DESC = 'name_desc',         // Ordem alfabética Z-A
  CREATED_ASC = 'created_asc',     // Mais antigos primeiro
  CREATED_DESC = 'created_desc',   // Mais recentes primeiro
  RATING = 'rating',               // Melhor avaliação
}

export class QueryProductDto {
  // Termo de busca para pesquisar no nome e descrição
  @ApiProperty({ description: 'Termo de busca', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  // Filtro por categoria
  @ApiProperty({ description: 'ID da categoria', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  // Preço mínimo para filtro de faixa de preço
  @ApiProperty({ description: 'Preço mínimo', required: false })
  @IsOptional()
  @Type(() => Number) // Transforma a string da query em número
  @IsNumber()
  @Min(0)
  minPrice?: number;

  // Preço máximo para filtro de faixa de preço
  @ApiProperty({ description: 'Preço máximo', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // Campo de ordenação dos resultados
  @ApiProperty({ enum: ProductSortBy, description: 'Ordenação', required: false })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy;

  // Número da página para paginação (começa em 1)
  @ApiProperty({ description: 'Número da página', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  // Quantidade de itens por página
  @ApiProperty({ description: 'Itens por página', required: false, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 12;

  // Filtro para mostrar apenas produtos em destaque
  @ApiProperty({ description: 'Apenas produtos em destaque', required: false })
  @IsOptional()
  featured?: boolean;
}
