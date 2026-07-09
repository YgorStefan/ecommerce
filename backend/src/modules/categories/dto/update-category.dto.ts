// DTO para atualização de categoria — todos os campos opcionais, mas ainda validados

import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiProperty({
    description: 'Indica se a categoria está ativa',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
