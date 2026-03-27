import { Injectable, BadRequestException } from '@nestjs/common';
import { calcularPrecoPrazo } from 'correios-brasil';

@Injectable()
export class ShippingService {
  async calculate(zipCode: string) {
    try {
      const cleanZip = zipCode.replace(/\D/g, '');

      const args = {
        sCepOrigem: '01001000', // CEP Origem Padrão
        sCepDestino: cleanZip,
        nVlPeso: '1',
        nCdFormato: '1', // 1 para caixa
        nVlComprimento: '20',
        nVlAltura: '20',
        nVlLargura: '20',
        nCdServico: ['04014', '04510'], // 04014 = SEDEX, 04510 = PAC
        nVlDiametro: '0',
      };

      const result = await calcularPrecoPrazo(args);

      return result.map(service => ({
        code: service.Codigo,
        name: service.Codigo === '04014' ? 'SEDEX' : 'PAC',
        price: service.Valor,
        deadline: parseInt(service.PrazoEntrega),
        error: service.MsgErro || null,
      }));
    } catch (error: any) {
      throw new BadRequestException('Não foi possível calcular o frete no momento.');
    }
  }
}
