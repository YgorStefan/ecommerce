// orders.module.ts
// Módulo de pedidos — integra carrinho, cupons, produtos e e-mail

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { ProductsModule } from '../products/products.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CartModule, // Para obter e limpar o carrinho
    CouponsModule, // Para validar e aplicar cupons
    ProductsModule, // Para atualizar o estoque
    EmailModule, // Para enviar confirmações por e-mail
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
