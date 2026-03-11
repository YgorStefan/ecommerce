// cart.entity.ts
// Define a entidade Cart (carrinho de compras) — cada usuário tem um carrinho

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
  // Identificador único do carrinho
  @ApiProperty({ description: 'ID do carrinho' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relação OneToOne: cada usuário tem exatamente um carrinho
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Chave estrangeira do usuário dono do carrinho
  @Column({ unique: true })
  userId: string;

  // Relação OneToMany: um carrinho contém vários itens
  @ApiProperty({ description: 'Itens no carrinho', type: [CartItem] })
  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,  // Salva/deleta itens junto com o carrinho
    eager: true,    // Carrega os itens automaticamente
  })
  items: CartItem[];

  // Data de criação do carrinho
  @CreateDateColumn()
  createdAt: Date;

  // Data da última modificação do carrinho
  @UpdateDateColumn()
  updatedAt: Date;
}
