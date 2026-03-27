// Controller de avaliações de produtos

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService, CreateReviewDto } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Avaliações')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  // GET /api/reviews/product/:productId — lista avaliações de um produto
  @Get('product/:productId')
  @ApiOperation({ summary: 'Listar avaliações de um produto' })
  findByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: number,
  ) {
    return this.reviewsService.findByProduct(productId, page);
  }

  // GET /api/reviews/me — avaliações do usuário logado
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar minhas avaliações' })
  findMyReviews(@CurrentUser() user: User) {
    return this.reviewsService.findByUser(user.id);
  }

  // POST /api/reviews — cria uma avaliação
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar avaliação de produto' })
  create(@CurrentUser() user: User, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(user.id, createReviewDto);
  }

  // DELETE /api/reviews/:id — remove uma avaliação
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover avaliação' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.reviewsService.remove(id, user.id, isAdmin);
  }
}
