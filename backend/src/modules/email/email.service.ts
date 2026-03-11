// email.service.ts
// Serviço de envio de e-mails transacionais via Nodemailer

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '../users/entities/user.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class EmailService {
  // Logger para registrar erros de envio de e-mail
  private readonly logger = new Logger(EmailService.name);

  // Transporte do Nodemailer configurado com as credenciais SMTP
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Cria o transporte SMTP com as configurações do ambiente
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false, // false para TLS; true para SSL na porta 465
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  // Método base que envia um e-mail com template HTML
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      // Envia o e-mail com o remetente configurado no ambiente
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', 'E-commerce <noreply@ecommerce.com>'),
        to,
        subject,
        html,
      });

      this.logger.log(`E-mail enviado para ${to}: ${subject}`);
    } catch (error) {
      // Registra o erro mas não lança exceção para não interromper o fluxo
      this.logger.error(`Erro ao enviar e-mail para ${to}: ${error.message}`);
      throw error; // Re-lança para que o chamador possa decidir como tratar
    }
  }

  // Envia e-mail de boas-vindas ao novo usuário cadastrado
  async sendWelcomeEmail(user: User): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #111; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #111; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo ao E-commerce!</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${user.name}</strong>!</p>
              <p>Sua conta foi criada com sucesso. Estamos felizes em tê-lo conosco!</p>
              <p>Agora você pode:</p>
              <ul>
                <li>Explorar nossos produtos</li>
                <li>Adicionar itens à sua lista de desejos</li>
                <li>Realizar compras com segurança</li>
                <li>Acompanhar seus pedidos</li>
              </ul>
              <a href="${this.configService.get('NEXT_PUBLIC_API_URL', 'http://localhost:3000')}" class="button">
                Começar a comprar
              </a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} E-commerce. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(user.email, 'Bem-vindo ao E-commerce!', html);
  }

  // Envia e-mail de confirmação de pedido com resumo completo
  async sendOrderConfirmation(user: User, order: Order): Promise<void> {
    // Gera as linhas da tabela de itens do pedido
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            R$ ${Number(item.unitPrice).toFixed(2)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            R$ ${Number(item.total).toFixed(2)}
          </td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #111; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #eee; padding: 10px; text-align: left; }
            .total-row { font-weight: bold; background: #f0f0f0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Pedido Confirmado!</h1>
              <p>Pedido #${order.orderNumber}</p>
            </div>
            <div class="content">
              <p>Olá, <strong>${user.name}</strong>!</p>
              <p>Seu pedido foi recebido e está sendo processado.</p>
              
              <h3>Itens do Pedido</h3>
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th style="text-align: center;">Qtd</th>
                    <th style="text-align: right;">Preço Unit.</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right;">Subtotal:</td>
                    <td style="padding: 10px; text-align: right;">R$ ${Number(order.subtotal).toFixed(2)}</td>
                  </tr>
                  ${order.discountAmount > 0 ? `
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right; color: green;">Desconto:</td>
                    <td style="padding: 10px; text-align: right; color: green;">- R$ ${Number(order.discountAmount).toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right;">Frete:</td>
                    <td style="padding: 10px; text-align: right;">R$ ${Number(order.shippingCost).toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3" style="padding: 10px; text-align: right;">TOTAL:</td>
                    <td style="padding: 10px; text-align: right;">R$ ${Number(order.total).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <h3>Endereço de Entrega</h3>
              <p>
                ${order.shippingAddress.name}<br>
                ${order.shippingAddress.address}<br>
                ${order.shippingAddress.city} - ${order.shippingAddress.state}<br>
                CEP: ${order.shippingAddress.zipCode}
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} E-commerce. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      user.email,
      `Pedido Confirmado - #${order.orderNumber}`,
      html,
    );
  }

  // Envia e-mail de notificação quando o status do pedido é atualizado
  async sendOrderStatusUpdate(user: User, order: Order): Promise<void> {
    // Mapeia os status para mensagens amigáveis em português
    const statusMessages: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Seu pedido foi recebido e aguarda processamento.',
      [OrderStatus.PROCESSING]: 'Seu pedido está sendo preparado.',
      [OrderStatus.SHIPPED]: 'Seu pedido foi enviado e está a caminho!',
      [OrderStatus.DELIVERED]: 'Seu pedido foi entregue. Aproveite!',
      [OrderStatus.CANCELLED]: 'Seu pedido foi cancelado.',
    };

    const message = statusMessages[order.status] || 'O status do seu pedido foi atualizado.';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #111; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; background: #333; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Atualização do Pedido</h1>
              <p>#${order.orderNumber}</p>
            </div>
            <div class="content">
              <p>Olá, <strong>${user.name}</strong>!</p>
              <p>${message}</p>
              <p>Status atual: <span class="status-badge">${order.status.toUpperCase()}</span></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} E-commerce. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      user.email,
      `Atualização do Pedido #${order.orderNumber}`,
      html,
    );
  }
}
