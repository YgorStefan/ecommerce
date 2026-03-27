// Módulo do carrinho de compras

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    // Registra as entidades necessárias para o módulo do carrinho
    TypeOrmModule.forFeature([Cart, CartItem, Product]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService], // Exporta para uso no módulo de pedidos
})
export class CartModule { }
