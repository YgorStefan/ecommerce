// Encapsula toda a interação com o SDK do Stripe (pagamentos com cartão em modo teste)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  readonly client: Stripe;
  readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.isConfigured = Boolean(secretKey);

    if (!this.isConfigured) {
      // Sem chave configurada o backend continua funcionando (PIX/boleto não dependem
      // do Stripe) — apenas o checkout com cartão falhará com uma mensagem clara
      this.logger.warn(
        'STRIPE_SECRET_KEY não configurada — pagamentos com cartão ficarão indisponíveis',
      );
    }

    this.client = new Stripe(secretKey || 'sk_test_placeholder_not_configured', {
      apiVersion: '2026-06-24.dahlia',
    });
  }

  // Cria um PaymentIntent para o valor total do pedido (em centavos)
  async createPaymentIntent(
    amountInCents: number,
    orderId: string,
    orderNumber: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.client.paymentIntents.create({
      amount: amountInCents,
      currency: 'brl',
      metadata: { orderId, orderNumber },
      automatic_payment_methods: { enabled: true },
    });
  }

  // Verifica a assinatura do webhook e reconstrói o evento — nunca confie em um
  // payload de webhook sem validar a assinatura
  constructEvent(
    payload: Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    return this.client.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
