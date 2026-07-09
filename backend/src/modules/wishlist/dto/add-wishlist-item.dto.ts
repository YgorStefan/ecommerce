// DTO para adicionar um produto à lista de desejos

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddWishlistItemDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  productId: string;
}
