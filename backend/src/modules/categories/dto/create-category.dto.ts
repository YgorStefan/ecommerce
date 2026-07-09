// DTO para criação de categoria com validação de campos

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Eletrônicos', description: 'Nome da categoria' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Descrição da categoria', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'URL da imagem da categoria', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
