import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calcularPrecoPrazo } from 'correios-brasil';

@Injectable()
export class ShippingService {
  constructor(private configService: ConfigService) {}

  // `weightGrams` é o peso total do carrinho em gramas. Quando informado, o frete
  // reflete o peso real da compra; na ausência, assume 1kg como estimativa padrão.
  async calculate(zipCode: string, weightGrams?: number) {
    try {
      const cleanZip = zipCode.replace(/\D/g, '');

      // Converte gramas para kg; os Correios exigem peso mínimo de 0,3kg
      const weightKg = weightGrams && weightGrams > 0 ? weightGrams / 1000 : 1;
      const pesoKg = Math.max(0.3, Math.round(weightKg * 1000) / 1000);

      const args = {
        sCepOrigem: this.configService.get<string>(
          'SHIPPING_ORIGIN_ZIP',
          '01001000',
        ),
        sCepDestino: cleanZip,
        nVlPeso: String(pesoKg),
        nCdFormato: '1', // 1 para caixa
        nVlComprimento: '20',
        nVlAltura: '20',
        nVlLargura: '20',
        nCdServico: ['04014', '04510'], // 04014 = SEDEX, 04510 = PAC
        nVlDiametro: '0',
      };

      const result = await calcularPrecoPrazo(args);

      return result.map((service) => ({
        code: service.Codigo,
        name: service.Codigo === '04014' ? 'SEDEX' : 'PAC',
        price: service.Valor,
        deadline: parseInt(service.PrazoEntrega),
        error: service.MsgErro || null,
      }));
    } catch (error: any) {
      throw new BadRequestException(
        'Não foi possível calcular o frete no momento.',
      );
    }
  }
}
