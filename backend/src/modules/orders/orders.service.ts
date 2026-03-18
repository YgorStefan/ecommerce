// orders.service.ts
// Serviço de pedidos — gerencia o checkout, atualização de status e histórico

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    // Repositório de pedidos
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    // Repositório dos itens do pedido
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    // Serviço do carrinho para obter e limpar após o pedido
    private cartService: CartService,
    // Serviço de cupons para validar e aplicar descontos
    private couponsService: CouponsService,
    // Serviço de produtos para atualizar estoque
    private productsService: ProductsService,
    // Serviço de e-mail para enviar confirmações
    private emailService: EmailService,
  ) {}

  // Cria um pedido a partir do carrinho do usuário (processo de checkout)
  async create(user: User, createOrderDto: CreateOrderDto): Promise<Order> {
    // Obtém o carrinho atual do usuário com todos os itens
    const cart = await this.cartService.getCart(user.id);

    // Valida que o carrinho não está vazio
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('O carrinho está vazio');
    }

    // Calcula o subtotal do pedido (soma dos preços × quantidades)
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    let discountAmount = 0;
    let couponId: string | undefined = undefined;

    // Aplica cupom de desconto se fornecido
    if (createOrderDto.couponCode) {
      const coupon = await this.couponsService.validate(
        createOrderDto.couponCode,
        subtotal,
      );
      couponId = coupon.id;
      discountAmount = await this.couponsService.calculateDiscount(
        coupon,
        subtotal,
      );
    }

    // Aplica desconto de 5% para pagamento via PIX
    if (createOrderDto.paymentMethod === PaymentMethod.PIX) {
      const pixDiscount = Math.round(subtotal * 0.05 * 100) / 100;
      discountAmount = Math.round((discountAmount + pixDiscount) * 100) / 100;
    }

    // Calcula o frete (simulado — em produção integraria com API de frete)
    const shippingCost = subtotal > 200 ? 0 : 19.9; // Frete grátis acima de R$ 200

    // Calcula o total final: subtotal - desconto + frete
    const total = subtotal - discountAmount + shippingCost;

    // Gera um número de pedido único e legível (ex: ORD-20240315-000001)
    const orderNumber = await this.generateOrderNumber();

    // Cria a entidade do pedido com todos os dados calculados
    const order: any = this.ordersRepository.create({
      orderNumber,
      userId: user.id,
      paymentMethod: createOrderDto.paymentMethod,
      shippingAddress: createOrderDto.shippingAddress,
      notes: createOrderDto.notes,
      subtotal,
      discountAmount,
      shippingCost,
      total,
      couponId,
      // Simula pagamento confirmado (em produção integraria com gateway)
      paymentStatus: PaymentStatus.PAID,
    });

    // Salva o pedido no banco para obter o ID
    const savedOrder = await this.ordersRepository.save(order);

    // Cria os itens do pedido como snapshot dos produtos (para histórico imutável)
    const orderItems = cart.items.map((cartItem) =>
      this.orderItemsRepository.create({
        orderId: savedOrder.id,
        productId: cartItem.productId,
        productName: cartItem.product.name, // Snapshot do nome atual
        productImage: cartItem.product.imageUrl, // Snapshot da imagem atual
        unitPrice: cartItem.product.price, // Snapshot do preço atual
        quantity: cartItem.quantity,
        total: Number(cartItem.product.price) * cartItem.quantity,
      }),
    );

    // Salva todos os itens do pedido
    await this.orderItemsRepository.save(orderItems);

    // Atualiza o estoque de cada produto vendido
    for (const cartItem of cart.items) {
      await this.productsService.updateStock(
        cartItem.productId,
        cartItem.quantity,
      );
    }

    // Incrementa o contador de uso do cupom se foi usado
    if (couponId) {
      await this.couponsService.incrementUsage(couponId);
    }

    // Esvazia o carrinho após a criação bem-sucedida do pedido
    await this.cartService.clearCart(user.id);

    // Busca o pedido completo com todas as relações para retornar ao cliente
    const fullOrder = await this.findOne(savedOrder.id, user.id);

    // Envia e-mail de confirmação de forma assíncrona (não bloqueia a resposta)
    this.emailService.sendOrderConfirmation(user, fullOrder).catch(() => {
      // Ignora erros de e-mail para não afetar o fluxo do pedido
    });

    return fullOrder;
  }

  // Lista os pedidos do usuário autenticado com paginação
  async findMyOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' }, // Mais recentes primeiro
      skip,
      take: limit,
      relations: ['items', 'coupon'],
    });

    return {
      orders,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // Busca um pedido específico verificando se pertence ao usuário
  async findOne(id: string, userId?: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'coupon', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Se userId foi fornecido, verifica se o pedido pertence ao usuário
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('Acesso negado ao pedido');
    }

    return order;
  }

  // Lista todos os pedidos (para o painel admin) com paginação e filtros
  async findAll(page = 1, limit = 20, status?: OrderStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [orders, total] = await this.ordersRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['user'],
    });

    return {
      orders,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // Atualiza o status de um pedido (apenas admin)
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);

    // Atualiza o status do pedido
    order.status = status;
    const updatedOrder = await this.ordersRepository.save(order);

    // Notifica o cliente sobre a mudança de status por e-mail
    this.emailService
      .sendOrderStatusUpdate(order.user, updatedOrder)
      .catch(() => {});

    return updatedOrder;
  }

  // Retorna estatísticas de vendas para o painel admin
  async getSalesStats() {
    // Soma total de vendas de pedidos pagos
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'totalRevenue')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    // Calcula receita dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyResult = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'monthlyRevenue')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .andWhere('order.createdAt >= :date', { date: thirtyDaysAgo })
      .getRawOne();

    return {
      totalRevenue: Number(result.totalRevenue) || 0,
      totalOrders: Number(result.totalOrders) || 0,
      monthlyRevenue: Number(monthlyResult.monthlyRevenue) || 0,
    };
  }

  // Gera um número de pedido único e legível
  private async generateOrderNumber(): Promise<string> {
    // Conta os pedidos existentes para criar um número sequencial
    const count = await this.ordersRepository.count();
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    // Formata como ORD-20240315-000042
    return `ORD-${dateStr}-${String(count + 1).padStart(6, '0')}`;
  }
}
