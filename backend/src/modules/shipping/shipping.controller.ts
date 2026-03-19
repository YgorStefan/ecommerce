import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';

@ApiTags('Frete')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('calculate')
  @ApiOperation({ summary: 'Calcula preços e prazos de CEP Origem para Destino' })
  calculate(@Query('zipCode') zipCode: string) {
    if (!zipCode || zipCode.length < 8) {
      throw new BadRequestException('CEP inválido ou não informado.');
    }
    return this.shippingService.calculate(zipCode);
  }
}
