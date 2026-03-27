// Define a entidade CartItem — representa um produto dentro do carrinho

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
export class CartItem {
  // Identificador único do item no carrinho
  @ApiProperty({ description: 'ID do item no carrinho' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relação ManyToOne: muitos itens pertencem a um carrinho
  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE', // Ao deletar o carrinho, os itens são removidos
  })
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  // Chave estrangeira do carrinho
  @Column()
  cartId: string;

  // Relação ManyToOne: muitos itens podem referenciar o mesmo produto
  @ApiProperty({ description: 'Produto no carrinho' })
  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Chave estrangeira do produto
  @Column()
  productId: string;

  // Quantidade do produto no carrinho
  @ApiProperty({ description: 'Quantidade do produto' })
  @Column()
  quantity: number;

  // Data de adição ao carrinho
  @CreateDateColumn()
  createdAt: Date;

  // Data de atualização
  @UpdateDateColumn()
  updatedAt: Date;
}
