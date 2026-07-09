// DTO para atualizar a quantidade de um item do carrinho

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ description: 'Nova quantidade', example: 2 })
  @IsInt()
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  @Max(99, { message: 'Quantidade máxima por item é 99' })
  quantity: number;
}
