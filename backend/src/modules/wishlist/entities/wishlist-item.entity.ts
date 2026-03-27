// Define a entidade WishlistItem

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

// Garante que o mesmo produto não apareça duas vezes na wishlist do mesmo usuário
@Unique(['userId', 'productId'])
@Entity('wishlist_items')
export class WishlistItem {
  // Identificador único do item na lista de desejos
  @ApiProperty({ description: 'ID do item na wishlist' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relação ManyToOne: muitos itens pertencem a um usuário
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Chave estrangeira do usuário
  @Column()
  userId: string;

  // Relação ManyToOne: o produto desejado
  @ApiProperty({ description: 'Produto na lista de desejos' })
  @ManyToOne(() => Product, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Chave estrangeira do produto
  @Column()
  productId: string;

  // Data em que o produto foi adicionado à lista de desejos
  @ApiProperty({ description: 'Data de adição à lista de desejos' })
  @CreateDateColumn()
  createdAt: Date;
}
