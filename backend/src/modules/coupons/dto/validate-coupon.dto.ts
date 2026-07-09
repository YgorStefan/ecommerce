// DTO para validar um cupom durante o checkout

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length, Min } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ example: 'DESCONTO10', description: 'Código do cupom' })
  @IsString()
  @Length(3, 50)
  code: string;

  @ApiProperty({ example: 150, description: 'Subtotal atual do carrinho' })
  @IsNumber()
  @Min(0)
  orderSubtotal: number;
}
