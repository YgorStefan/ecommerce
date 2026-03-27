// DTO para atualização do perfil do usuário

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  // Nome opcional para atualização
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  // Telefone opcional
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  // Endereço de entrega opcional
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  // Cidade opcional
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  // Estado opcional
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  // CEP opcional
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;
}

// DTO específico para admin atualizar papel e status do usuário
export class AdminUpdateUserDto extends UpdateUserDto {
  // Papel do usuário — apenas admin pode alterar
  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // Status ativo/inativo — apenas admin pode alterar
  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;
}
