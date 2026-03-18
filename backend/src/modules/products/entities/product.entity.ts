// product.entity.ts
// Define a entidade Product (produto) com todas as suas relações

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../categories/entities/category.entity';
import { ProductImage } from './product-image.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('products')
export class Product {
  // Identificador único do produto
  @ApiProperty({ description: 'ID único do produto' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nome do produto exibido na loja
  @ApiProperty({ description: 'Nome do produto' })
  @Column({ length: 200 })
  name: string;

  // Slug para URLs amigáveis (ex: camiseta-branca-basica)
  @ApiProperty({ description: 'Slug para URL amigável' })
  @Column({ unique: true, length: 220 })
  slug: string;

  // Descrição completa do produto
  @ApiProperty({ description: 'Descrição detalhada do produto' })
  @Column({ type: 'text' })
  description: string;

  // Preço de venda do produto com precisão de 2 casas decimais
  @ApiProperty({ description: 'Preço do produto' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // Preço original para mostrar desconto (opcional)
  @ApiProperty({
    description: 'Preço original (para mostrar desconto)',
    required: false,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  // Quantidade em estoque disponível para compra
  @ApiProperty({ description: 'Quantidade em estoque' })
  @Column({ default: 0 })
  stock: number;

  // Código SKU único do produto para controle de estoque
  @ApiProperty({ description: 'Código SKU único', required: false })
  @Column({ unique: true, nullable: true, length: 50 })
  sku: string;

  // URL da imagem principal do produto
  @ApiProperty({ description: 'URL da imagem principal', required: false })
  @Column({ nullable: true })
  imageUrl: string;

  // Indica se o produto está disponível para venda
  @ApiProperty({ description: 'Indica se o produto está ativo' })
  @Column({ default: true })
  isActive: boolean;

  // Indica se o produto está em destaque na página inicial
  @ApiProperty({ description: 'Indica se o produto está em destaque' })
  @Column({ default: false })
  isFeatured: boolean;

  // Peso do produto em gramas (para cálculo de frete)
  @ApiProperty({ description: 'Peso em gramas', required: false })
  @Column({ nullable: true })
  weight: number;

  // Relação ManyToOne: muitos produtos pertencem a uma categoria
  @ApiProperty({ description: 'Categoria do produto' })
  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  // Chave estrangeira da categoria
  @Column({ nullable: true })
  categoryId: string;

  // Relação OneToMany: um produto possui várias imagens
  @ApiProperty({ description: 'Imagens do produto', type: [ProductImage] })
  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true, // Ao salvar o produto, as imagens são salvas automaticamente
    eager: true, // Carrega as imagens automaticamente junto com o produto
  })
  images: ProductImage[];

  // Relação OneToMany: um produto pode ter várias avaliações
  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  // Média das avaliações calculada e armazenada para performance
  @ApiProperty({ description: 'Média das avaliações' })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  // Contagem total de avaliações
  @ApiProperty({ description: 'Total de avaliações' })
  @Column({ default: 0 })
  reviewCount: number;

  // Data de criação preenchida automaticamente
  @CreateDateColumn()
  createdAt: Date;

  // Data de última atualização preenchida automaticamente
  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete para manter histórico de pedidos
  @DeleteDateColumn()
  deletedAt: Date;
}
