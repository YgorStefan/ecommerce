// Define a entidade User

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Enum que define os possíveis papéis de um usuário no sistema
export enum UserRole {
  ADMIN = 'admin', // Acesso total ao painel administrativo
  USER = 'user', // Acesso padrão do cliente da loja
}

// @Entity() indica que esta classe é uma entidade TypeORM e mapeia para uma tabela
@Entity('users')
export class User {
  // Gera automaticamente um UUID como chave primária
  @ApiProperty({ description: 'ID único do usuário' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nome completo do usuário
  @ApiProperty({ description: 'Nome completo do usuário' })
  @Column({ length: 150 })
  name: string;

  // E-mail único para autenticação
  @ApiProperty({ description: 'Endereço de e-mail único' })
  @Column({ unique: true, length: 200 })
  email: string;

  // Senha armazenada como hash bcrypt — @Exclude() impede que seja retornada nas respostas
  @Exclude()
  @Column()
  password: string;

  // Papel do usuário no sistema
  @ApiProperty({ enum: UserRole, description: 'Papel do usuário' })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  // Número de telefone opcional
  @ApiProperty({ description: 'Telefone do usuário', required: false })
  @Column({ nullable: true, length: 20 })
  phone: string;

  // Endereço de entrega padrão
  @ApiProperty({ description: 'Endereço padrão de entrega', required: false })
  @Column({ nullable: true, type: 'text' })
  address: string;

  // Cidade do endereço
  @ApiProperty({ description: 'Cidade', required: false })
  @Column({ nullable: true, length: 100 })
  city: string;

  // Estado do endereço
  @ApiProperty({ description: 'Estado', required: false })
  @Column({ nullable: true, length: 50 })
  state: string;

  // CEP
  @ApiProperty({ description: 'CEP', required: false })
  @Column({ nullable: true, length: 10 })
  zipCode: string;

  // Indica se a conta está ativa
  @ApiProperty({ description: 'Indica se a conta está ativa' })
  @Column({ default: true })
  isActive: boolean;

  // Token de refresh JWT armazenado para validação
  // type: 'varchar' obrigatório pois TypeORM não infere o tipo de "string | null"
  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  // Data e hora de criação — preenchida automaticamente pelo TypeORM
  @ApiProperty({ description: 'Data de criação da conta' })
  @CreateDateColumn()
  createdAt: Date;

  // Data e hora da última atualização — preenchida automaticamente
  @ApiProperty({ description: 'Data da última atualização' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete: armazena a data de exclusão sem remover o registro do banco
  @DeleteDateColumn()
  deletedAt: Date;
}
