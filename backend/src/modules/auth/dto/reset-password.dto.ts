// DTO para redefinir a senha usando o token recebido por e-mail

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de recuperação recebido por e-mail' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'novaSenha123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres' })
  newPassword: string;
}
