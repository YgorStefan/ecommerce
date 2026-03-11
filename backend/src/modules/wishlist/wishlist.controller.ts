// wishlist.controller.ts
// Controller da lista de desejos — todos os endpoints exigem autenticação

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Lista de Desejos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Todos os endpoints da wishlist exigem autenticação
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  // GET /api/wishlist — lista todos os itens da wishlist do usuário
  @Get()
  @ApiOperation({ summary: 'Listar itens da lista de desejos' })
  findAll(@CurrentUser() user: User) {
    return this.wishlistService.findAll(user.id);
  }

  // POST /api/wishlist — adiciona produto à wishlist
  @Post()
  @ApiOperation({ summary: 'Adicionar produto à lista de desejos' })
  addItem(
    @CurrentUser() user: User,
    @Body() body: { productId: string },
  ) {
    return this.wishlistService.addItem(user.id, body.productId);
  }

  // DELETE /api/wishlist/:productId — remove produto da wishlist
  @Delete(':productId')
  @ApiOperation({ summary: 'Remover produto da lista de desejos' })
  removeItem(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeItem(user.id, productId);
  }

  // GET /api/wishlist/check/:productId — verifica se produto está na wishlist
  @Get('check/:productId')
  @ApiOperation({ summary: 'Verificar se produto está na lista de desejos' })
  checkItem(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.isInWishlist(user.id, productId);
  }
}
