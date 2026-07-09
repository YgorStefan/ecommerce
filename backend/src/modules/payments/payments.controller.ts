// Controller que recebe os webhooks de pagamento do Stripe

import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { PaymentsService } from './payments.service';

// Excluído do Swagger: rota pública chamada apenas pelo Stripe, autenticada por assinatura
@ApiExcludeController()
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) { }

  // POST /api/payments/webhook — recebe eventos assíncronos do Stripe
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret || !req.rawBody) {
      throw new BadRequestException('Webhook do Stripe mal configurado ou inválido');
    }

    let event: Stripe.Event;
    try {
      // Verifica a assinatura HMAC — garante que o payload realmente veio do Stripe
      event = this.stripeService.constructEvent(req.rawBody, signature, webhookSecret);
    } catch (error) {
      this.logger.warn(`Assinatura de webhook inválida: ${(error as Error).message}`);
      throw new BadRequestException('Assinatura do webhook inválida');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.paymentsService.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.paymentsService.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      default:
        // Outros eventos não são relevantes para o fluxo atual — ignorados silenciosamente
        break;
    }

    return { received: true };
  }
}
