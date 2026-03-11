// order.entity.ts
// Define a entidade Order (pedido) com todos os seus campos e relações

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';

// Enum para os possíveis estados de um pedido
export enum OrderStatus {
  PENDING = 'pending',         // Pedido criado, aguardando processamento
  PROCESSING = 'processing',   // Pedido em processamento
  SHIPPED = 'shipped',         // Pedido enviado ao cliente
  DELIVERED = 'delivered',     // Pedido entregue ao cliente
  CANCELLED = 'cancelled',     // Pedido cancelado
}

// Enum para os métodos de pagamento disponíveis
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',   // Cartão de crédito
  DEBIT_CARD = 'debit_card',     // Cartão de débito
  PIX = 'pix',                   // Pagamento via PIX
  BOLETO = 'boleto',             // Boleto bancário
}

// Enum para o status do pagamento
export enum PaymentStatus {
  PENDING = 'pending',     // Aguardando pagamento
  PAID = 'paid',           // Pagamento confirmado
  FAILED = 'failed',       // Pagamento falhou
  REFUNDED = 'refunded',   // Pagamento estornado
}

@Entity('orders')
export class Order {
  // Identificador único do pedido
  @ApiProperty({ description: 'ID único do pedido' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Número do pedido amigável para exibição (ex: ORD-2024-000001)
  @ApiProperty({ description: 'Número do pedido' })
  @Column({ unique: true, length: 50 })
  orderNumber: string;

  // Relação ManyToOne: muitos pedidos pertencem a um usuário
  @ApiProperty({ description: 'Usuário que fez o pedido' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Chave estrangeira do usuário
  @Column()
  userId: string;

  // Relação OneToMany: um pedido contém vários itens
  @ApiProperty({ description: 'Itens do pedido', type: [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,   // Salva os itens ao salvar o pedido
    eager: true,     // Carrega os itens junto com o pedido
  })
  items: OrderItem[];

  // Status atual do pedido
  @ApiProperty({ enum: OrderStatus, description: 'Status do pedido' })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  // Método de pagamento utilizado
  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento' })
  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  // Status do pagamento
  @ApiProperty({ enum: PaymentStatus, description: 'Status do pagamento' })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  // Subtotal do pedido antes de descontos
  @ApiProperty({ description: 'Subtotal do pedido' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // Valor do desconto aplicado por cupom
  @ApiProperty({ description: 'Valor do desconto do cupom' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  // Valor do frete
  @ApiProperty({ description: 'Valor do frete' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  // Valor total do pedido (subtotal - desconto + frete)
  @ApiProperty({ description: 'Valor total do pedido' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Cupom utilizado no pedido (relação opcional)
  @ManyToOne(() => Coupon, { nullable: true, eager: true })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  // Chave estrangeira do cupom
  @Column({ nullable: true })
  couponId: string;

  // Endereço de entrega — armazenado como JSON para histórico imutável
  @ApiProperty({ description: 'Endereço de entrega' })
  @Column({ type: 'jsonb' })
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };

  // Notas ou observações do pedido
  @ApiProperty({ description: 'Observações do pedido', required: false })
  @Column({ nullable: true, type: 'text' })
  notes: string;

  // Data de criação do pedido
  @ApiProperty({ description: 'Data de criação do pedido' })
  @CreateDateColumn()
  createdAt: Date;

  // Data da última atualização
  @UpdateDateColumn()
  updatedAt: Date;
}
