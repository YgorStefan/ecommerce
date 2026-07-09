// DTO para atualização administrativa do status de um pedido

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'Novo status do pedido' })
  @IsEnum(OrderStatus, { message: 'Status de pedido inválido' })
  status: OrderStatus;
}
