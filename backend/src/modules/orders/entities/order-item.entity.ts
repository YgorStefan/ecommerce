// order-item.entity.ts
// Define a entidade OrderItem — representa cada produto dentro de um pedido

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  // Identificador único do item do pedido
  @ApiProperty({ description: 'ID do item do pedido' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relação ManyToOne: muitos itens pertencem a um pedido
  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE', // Ao deletar o pedido, os itens são removidos
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  // Chave estrangeira do pedido
  @Column()
  orderId: string;

  // Referência ao produto original (pode ser deletado, mas o histórico permanece)
  @ApiProperty({ description: 'Produto do item' })
  @ManyToOne(() => Product, { nullable: true, eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Chave estrangeira do produto
  @Column({ nullable: true })
  productId: string;

  // Nome do produto no momento da compra (snapshot para histórico)
  @ApiProperty({ description: 'Nome do produto no momento da compra' })
  @Column({ length: 200 })
  productName: string;

  // URL da imagem do produto no momento da compra
  @ApiProperty({ description: 'Imagem do produto no momento da compra', required: false })
  @Column({ nullable: true })
  productImage: string;

  // Preço unitário no momento da compra (snapshot para histórico)
  @ApiProperty({ description: 'Preço unitário no momento da compra' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  // Quantidade comprada
  @ApiProperty({ description: 'Quantidade comprada' })
  @Column()
  quantity: number;

  // Total do item (unitPrice × quantity)
  @ApiProperty({ description: 'Valor total do item' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;
}
