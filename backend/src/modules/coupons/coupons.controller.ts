// coupons.controller.ts
// Controller de cupons — validação pública e CRUD administrativo

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CouponsService,
  CreateCouponDto,
  UpdateCouponDto,
} from './coupons.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Cupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // POST /api/coupons/validate — valida um cupom (autenticado)
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validar e aplicar cupom ao carrinho' })
  validate(@Body() body: { code: string; orderSubtotal: number }) {
    return this.couponsService.validate(body.code, body.orderSubtotal);
  }

  // ================== ROTAS ADMINISTRATIVAS ==================

  // GET /api/coupons — lista todos os cupons (admin)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Listar todos os cupons' })
  findAll() {
    return this.couponsService.findAll();
  }

  // POST /api/coupons — cria cupom (admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Criar cupom de desconto' })
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  // PATCH /api/coupons/:id — atualiza cupom (admin)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Atualizar cupom' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCouponDto) {
    return this.couponsService.update(id, updateDto);
  }

  // DELETE /api/coupons/:id — remove cupom (admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Remover cupom' })
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
