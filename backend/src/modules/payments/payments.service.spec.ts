import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Order, PaymentStatus } from '../orders/entities/order.entity';
import { EmailService } from '../email/email.service';
import Stripe from 'stripe';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockOrdersRepo = { findOne: jest.fn(), save: jest.fn(), update: jest.fn() };
  const mockEmailService = { sendOrderConfirmation: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Order), useValue: mockOrdersRepo },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.clearAllMocks());

  const buildPaymentIntent = (orderId?: string): Stripe.PaymentIntent =>
    ({
      id: 'pi_123',
      metadata: orderId ? { orderId } : {},
    }) as unknown as Stripe.PaymentIntent;

  describe('handlePaymentIntentSucceeded', () => {
    it('não deve fazer nada se o PaymentIntent não tiver orderId nos metadados', async () => {
      await service.handlePaymentIntentSucceeded(buildPaymentIntent());

      expect(mockOrdersRepo.findOne).not.toHaveBeenCalled();
    });

    it('não deve fazer nada se o pedido não for encontrado', async () => {
      mockOrdersRepo.findOne.mockResolvedValue(null);

      await service.handlePaymentIntentSucceeded(buildPaymentIntent('o1'));

      expect(mockOrdersRepo.save).not.toHaveBeenCalled();
    });

    it('deve ser idempotente — não reprocessa um pedido já pago', async () => {
      mockOrdersRepo.findOne.mockResolvedValue({ id: 'o1', paymentStatus: PaymentStatus.PAID });

      await service.handlePaymentIntentSucceeded(buildPaymentIntent('o1'));

      expect(mockOrdersRepo.save).not.toHaveBeenCalled();
      expect(mockEmailService.sendOrderConfirmation).not.toHaveBeenCalled();
    });

    it('deve marcar o pedido como pago e enviar e-mail de confirmação', async () => {
      const order = { id: 'o1', paymentStatus: PaymentStatus.PENDING, user: {} };
      mockOrdersRepo.findOne.mockResolvedValue(order);

      await service.handlePaymentIntentSucceeded(buildPaymentIntent('o1'));

      expect(order.paymentStatus).toBe(PaymentStatus.PAID);
      expect(mockOrdersRepo.save).toHaveBeenCalledWith(order);
      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalled();
    });
  });

  describe('handlePaymentIntentFailed', () => {
    it('não deve fazer nada se não houver orderId nos metadados', async () => {
      await service.handlePaymentIntentFailed(buildPaymentIntent());

      expect(mockOrdersRepo.update).not.toHaveBeenCalled();
    });

    it('deve marcar o pedido como falho', async () => {
      await service.handlePaymentIntentFailed(buildPaymentIntent('o1'));

      expect(mockOrdersRepo.update).toHaveBeenCalledWith(
        'o1',
        expect.objectContaining({ paymentStatus: PaymentStatus.FAILED, paymentIntentId: 'pi_123' }),
      );
    });
  });
});
