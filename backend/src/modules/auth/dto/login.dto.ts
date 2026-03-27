// DTO para validar as credenciais de login do usuário

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  // E-mail do usuário para autenticação
  @ApiProperty({
    example: 'joao@example.com',
    description: 'E-mail cadastrado',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  // Senha do usuário
  @ApiProperty({ example: 'senha123', description: 'Senha da conta' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}
