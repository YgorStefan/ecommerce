// cart.controller.ts
// Controller do carrinho — todos os endpoints exigem autenticação

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Carrinho')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Todos os endpoints do carrinho exigem autenticação
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // GET /api/cart — obtém o carrinho do usuário autenticado
  @Get()
  @ApiOperation({ summary: 'Obter carrinho do usuário' })
  getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user.id);
  }

  // POST /api/cart/items — adiciona um produto ao carrinho
  @Post('items')
  @ApiOperation({ summary: 'Adicionar item ao carrinho' })
  addItem(
    @CurrentUser() user: User,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.cartService.addItem(user.id, body.productId, body.quantity);
  }

  // PATCH /api/cart/items/:itemId — atualiza a quantidade de um item
  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Atualizar quantidade de item no carrinho' })
  updateItem(
    @CurrentUser() user: User,
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateItem(user.id, itemId, body.quantity);
  }

  // DELETE /api/cart/items/:itemId — remove um item do carrinho
  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remover item do carrinho' })
  removeItem(@CurrentUser() user: User, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(user.id, itemId);
  }

  // DELETE /api/cart — esvazia o carrinho completamente
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Esvaziar carrinho' })
  clearCart(@CurrentUser() user: User) {
    return this.cartService.clearCart(user.id);
  }
}
