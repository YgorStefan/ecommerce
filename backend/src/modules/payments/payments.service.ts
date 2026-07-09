// Processa os eventos de pagamento recebidos via webhook do Stripe

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order, PaymentStatus } from '../orders/entities/order.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private emailService: EmailService,
  ) {}

  // Chamado quando o Stripe confirma que o pagamento foi concluído com sucesso
  async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      this.logger.warn(
        `PaymentIntent ${paymentIntent.id} sem orderId nos metadados`,
      );
      return;
    }

    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'user'],
    });

    if (!order) {
      this.logger.warn(
        `Pedido ${orderId} não encontrado para o webhook do Stripe`,
      );
      return;
    }

    // Idempotência: o Stripe pode reenviar o mesmo evento mais de uma vez
    if (order.paymentStatus === PaymentStatus.PAID) {
      return;
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.paymentIntentId = paymentIntent.id;
    await this.ordersRepository.save(order);

    this.logger.log(`Pagamento confirmado para o pedido ${order.orderNumber}`);

    // Envia o e-mail de confirmação agora que o pagamento foi de fato aprovado
    this.emailService.sendOrderConfirmation(order.user, order).catch(() => {
      // Falha de e-mail não deve afetar a confirmação do pagamento
    });
  }

  // Chamado quando o Stripe reporta falha na cobrança
  async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      return;
    }

    await this.ordersRepository.update(orderId, {
      paymentStatus: PaymentStatus.FAILED,
      paymentIntentId: paymentIntent.id,
    });

    this.logger.warn(`Pagamento falhou para o pedido ${orderId}`);
  }
}
