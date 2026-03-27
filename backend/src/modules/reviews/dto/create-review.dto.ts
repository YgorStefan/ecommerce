// DTO para criação de avaliação de produto

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 'uuid-do-produto',
    description: 'ID do produto avaliado',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 5, description: 'Nota de 1 a 5' })
  @IsInt()
  @Min(1, { message: 'A nota mínima é 1' })
  @Max(5, { message: 'A nota máxima é 5' })
  rating: number;

  @ApiProperty({
    example: 'Produto excelente!',
    description: 'Título da avaliação',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({
    example: 'Muito satisfeito com a compra.',
    description: 'Comentário da avaliação',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
