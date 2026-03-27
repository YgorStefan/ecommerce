// Define a entidade Review

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

// @Unique garante que um usuário só pode avaliar cada produto uma vez
@Unique(['userId', 'productId'])
@Entity('reviews')
export class Review {
  // Identificador único da avaliação
  @ApiProperty({ description: 'ID da avaliação' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relação ManyToOne: muitas avaliações pertencem a um usuário
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Chave estrangeira do usuário
  @Column()
  userId: string;

  // Relação ManyToOne: muitas avaliações pertencem a um produto
  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE', // Ao deletar o produto, as avaliações são removidas
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Chave estrangeira do produto
  @Column()
  productId: string;

  // Nota da avaliação de 1 a 5 estrelas
  @ApiProperty({
    description: 'Nota de 1 a 5 estrelas',
    minimum: 1,
    maximum: 5,
  })
  @Column()
  rating: number;

  // Título opcional da avaliação
  @ApiProperty({ description: 'Título da avaliação', required: false })
  @Column({ nullable: true, length: 200 })
  title: string;

  // Comentário detalhado da avaliação
  @ApiProperty({ description: 'Comentário da avaliação', required: false })
  @Column({ nullable: true, type: 'text' })
  comment: string;

  // Indica se a avaliação foi feita por um comprador verificado
  @ApiProperty({ description: 'Indica se é uma compra verificada' })
  @Column({ default: false })
  isVerifiedPurchase: boolean;

  // Data de criação da avaliação
  @CreateDateColumn()
  createdAt: Date;

  // Data de atualização
  @UpdateDateColumn()
  updatedAt: Date;
}
