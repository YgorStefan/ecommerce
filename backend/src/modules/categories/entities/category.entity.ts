// Define a entidade Category (categoria de produtos) no banco de dados

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('categories')
export class Category {
  // Identificador único da categoria
  @ApiProperty({ description: 'ID único da categoria' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nome da categoria (ex: Eletrônicos, Roupas, etc.)
  @ApiProperty({ description: 'Nome da categoria' })
  @Column({ unique: true, length: 100 })
  name: string;

  // Slug para uso em URLs amigáveis (ex: eletronicos, roupas-femininas)
  @ApiProperty({ description: 'Slug da categoria para URLs' })
  @Column({ unique: true, length: 120 })
  slug: string;

  // Descrição opcional da categoria
  @ApiProperty({ description: 'Descrição da categoria', required: false })
  @Column({ nullable: true, type: 'text' })
  description: string;

  // URL da imagem representativa da categoria
  @ApiProperty({ description: 'URL da imagem da categoria', required: false })
  @Column({ nullable: true })
  imageUrl: string;

  // Indica se a categoria está visível na loja
  @ApiProperty({ description: 'Indica se a categoria está ativa' })
  @Column({ default: true })
  isActive: boolean;

  // Data de criação preenchida automaticamente
  @ApiProperty({ description: 'Data de criação' })
  @CreateDateColumn()
  createdAt: Date;

  // Data de última atualização preenchida automaticamente
  @ApiProperty({ description: 'Data de atualização' })
  @UpdateDateColumn()
  updatedAt: Date;
}
