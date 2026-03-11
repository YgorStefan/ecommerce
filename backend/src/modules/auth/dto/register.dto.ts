// register.dto.ts
// DTO (Data Transfer Object) para validar os dados de cadastro de usuário

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  // Nome completo — obrigatório, entre 2 e 150 caracteres
  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(150, { message: 'Nome deve ter no máximo 150 caracteres' })
  name: string;

  // E-mail — obrigatório e deve ser um e-mail válido
  @ApiProperty({ example: 'joao@example.com', description: 'Endereço de e-mail' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  // Senha — obrigatória, mínimo 6 caracteres
  @ApiProperty({ example: 'senha123', description: 'Senha (mínimo 6 caracteres)' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Senha deve ter no máximo 100 caracteres' })
  password: string;

  // Telefone — opcional
  @ApiProperty({ example: '(11) 99999-9999', description: 'Telefone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
