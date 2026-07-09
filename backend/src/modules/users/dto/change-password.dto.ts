// DTO para validar a troca de senha do usuário autenticado

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  // Senha atual — necessária para confirmar a identidade do usuário
  @ApiProperty({ description: 'Senha atual' })
  @IsString()
  @MinLength(1, { message: 'Senha atual é obrigatória' })
  currentPassword: string;

  // Nova senha — mesma política de complexidade do cadastro
  @ApiProperty({ description: 'Nova senha (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  @MaxLength(100)
  newPassword: string;
}
