// Módulo de pedidos — integra carrinho, cupons, produtos e e-mail

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartModule } from '../cart/cart.module';
import { CartItem } from '../cart/entities/cart-item.entity';
import { CouponsModule } from '../coupons/coupons.module';
import { ProductsModule } from '../products/products.module';
import { EmailModule } from '../email/email.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, CartItem]),
    CartModule, // Para obter o carrinho
    CouponsModule, // Para validar e aplicar cupons
    ProductsModule, // Para atualizar o estoque
    EmailModule, // Para enviar confirmações por e-mail
    PaymentsModule, // Para criar o PaymentIntent do Stripe (pagamento com cartão)
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule { }
