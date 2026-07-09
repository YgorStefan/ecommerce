// DTO para solicitar a recuperação de senha

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'joao@example.com',
    description: 'E-mail cadastrado',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}
