// orders.controller.ts
// Controller de pedidos — endpoints para clientes e administradores

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Todos os endpoints de pedidos exigem autenticação
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/orders — cria um novo pedido a partir do carrinho
  @Post()
  @ApiOperation({ summary: 'Criar pedido (checkout)' })
  create(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user, createOrderDto);
  }

  // GET /api/orders/me — lista os pedidos do usuário autenticado
  @Get('me')
  @ApiOperation({ summary: 'Listar meus pedidos' })
  @ApiQuery({ name: 'page', required: false })
  findMyOrders(@CurrentUser() user: User, @Query('page') page?: number) {
    return this.ordersService.findMyOrders(user.id, page);
  }

  // GET /api/orders/me/:id — detalhe de um pedido do usuário
  @Get('me/:id')
  @ApiOperation({ summary: 'Detalhe de meu pedido' })
  findMyOrder(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ordersService.findOne(id, user.id);
  }

  // ================== ROTAS ADMINISTRATIVAS ==================

  // GET /api/orders/stats — estatísticas de vendas (admin)
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Estatísticas de vendas' })
  getSalesStats() {
    return this.ordersService.getSalesStats();
  }

  // GET /api/orders — lista todos os pedidos (admin)
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Listar todos os pedidos' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  findAll(@Query('page') page?: number, @Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(page, 20, status);
  }

  // GET /api/orders/:id — detalhe de qualquer pedido (admin)
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Detalhe de pedido' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // PATCH /api/orders/:id/status — atualiza status do pedido (admin)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Atualizar status do pedido' })
  updateStatus(@Param('id') id: string, @Body() body: { status: OrderStatus }) {
    return this.ordersService.updateStatus(id, body.status);
  }
}
