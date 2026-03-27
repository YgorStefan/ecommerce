// Controller de produtos — endpoints públicos e administrativos

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Produtos')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  // GET /api/products — lista produtos com filtros avançados
  @Get()
  @ApiOperation({ summary: 'Listar produtos com filtros e paginação' })
  findAll(@Query() queryDto: QueryProductDto) {
    return this.productsService.findAll(queryDto);
  }

  // GET /api/products/:slug — detalhe do produto por slug
  @Get(':slug')
  @ApiOperation({ summary: 'Buscar produto por slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // POST /api/products — cria produto
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Criar produto' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // PATCH /api/products/:id — atualiza produto
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Atualizar produto' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: Partial<CreateProductDto>,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // DELETE /api/products/:id — remove produto com soft delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Remover produto' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // POST /api/products/:id/images — faz upload de imagens do produto
  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[Admin] Fazer upload de imagens do produto' })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      // Configura o armazenamento dos arquivos no disco
      storage: diskStorage({
        destination: './uploads/products', // Pasta de destino
        filename: (req, file, callback) => {
          // Gera um nome único para cada arquivo usando timestamp + extensão original
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          callback(null, `${uniqueName}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Valida que apenas imagens são aceitas
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          callback(new Error('Apenas imagens são permitidas'), false);
        } else {
          callback(null, true);
        }
      },
    }),
  )
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Mapeia os arquivos para o formato esperado pelo serviço
    const images = files.map((file, index) => ({
      url: `/uploads/products/${file.filename}`, // URL pública da imagem
      alt: file.originalname,
      position: index,
    }));

    return this.productsService.addImages(id, images);
  }

  // DELETE /api/products/:id/images/:imageId — remove uma imagem
  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Remover imagem do produto' })
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productsService.removeImage(id, imageId);
  }
}
