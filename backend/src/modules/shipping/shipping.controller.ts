import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';

@ApiTags('Frete')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('calculate')
  // Limita chamadas por IP — cada cálculo dispara uma consulta externa aos Correios
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Calcula preços e prazos de CEP Origem para Destino',
  })
  calculate(
    @Query('zipCode') zipCode: string,
    // Peso total do carrinho em gramas (opcional) — torna o frete fiel à compra
    @Query('weight') weight?: string,
  ) {
    const cleanZip = zipCode?.replace(/\D/g, '') ?? '';
    if (!/^\d{8}$/.test(cleanZip)) {
      throw new BadRequestException('CEP inválido ou não informado.');
    }
    const weightGrams = weight ? Number(weight) : undefined;
    const safeWeight =
      weightGrams && Number.isFinite(weightGrams) && weightGrams > 0
        ? weightGrams
        : undefined;
    return this.shippingService.calculate(cleanZip, safeWeight);
  }
}
