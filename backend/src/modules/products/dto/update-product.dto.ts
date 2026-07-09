// DTO de atualização de produto — todos os campos de CreateProductDto se tornam opcionais,
// mas continuam validados pelo ValidationPipe (ao contrário de um `Partial<T>` puro, que
// perde os decorators de validação em tempo de execução)

import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) { }
