// DTO para adicionar um item ao carrinho

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantidade desejada', example: 1 })
  @IsInt()
  @Min(1, { message: 'Quantidade deve ser pelo menos 1' })
  @Max(99, { message: 'Quantidade máxima por item é 99' })
  quantity: number;
}
