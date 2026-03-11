// product-image.entity.ts
// Define a entidade ProductImage — cada produto pode ter múltiplas imagens

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  // Identificador único da imagem
  @ApiProperty({ description: 'ID da imagem' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // URL pública da imagem no servidor
  @ApiProperty({ description: 'URL da imagem' })
  @Column()
  url: string;

  // Texto alternativo para acessibilidade
  @ApiProperty({ description: 'Texto alternativo da imagem', required: false })
  @Column({ nullable: true, length: 200 })
  alt: string;

  // Ordem de exibição das imagens (a principal tem posição 0)
  @ApiProperty({ description: 'Ordem de exibição da imagem' })
  @Column({ default: 0 })
  position: number;

  // Relação ManyToOne: muitas imagens pertencem a um produto
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE', // Ao deletar o produto, as imagens são deletadas automaticamente
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Chave estrangeira do produto
  @Column()
  productId: string;

  // Data de criação da imagem
  @CreateDateColumn()
  createdAt: Date;
}
