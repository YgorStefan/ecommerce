import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';

@ApiTags('Frete')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) { }

  @Get('calculate')
  // Limita chamadas por IP — cada cálculo dispara uma consulta externa aos Correios
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Calcula preços e prazos de CEP Origem para Destino' })
  calculate(@Query('zipCode') zipCode: string) {
    const cleanZip = zipCode?.replace(/\D/g, '') ?? '';
    if (!/^\d{8}$/.test(cleanZip)) {
      throw new BadRequestException('CEP inválido ou não informado.');
    }
    return this.shippingService.calculate(cleanZip);
  }
}
