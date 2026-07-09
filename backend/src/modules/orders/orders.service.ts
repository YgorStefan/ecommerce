// Serviço de pedidos — gerencia o checkout, atualização de status e histórico

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, EntityManager } from 'typeorm';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { CartItem } from '../cart/entities/cart-item.entity';
import { CouponsService } from '../coupons/coupons.service';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';
import { StripeService } from '../payments/stripe.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';

// Métodos de pagamento processados via Stripe (cartão) — PIX e boleto continuam
// com o fluxo simulado já existente (confirmados como pagos imediatamente)
const CARD_PAYMENT_METHODS = [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD];

export interface CreateOrderResult {
  order: Order;
  clientSecret?: string;
}

// Máquina de estados simples: define para quais status um pedido pode transicionar
// a partir do status atual, evitando mudanças ilógicas (ex.: DELIVERED -> PENDING)
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    // Repositório de pedidos
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    // Repositório dos itens do pedido
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    // Serviço do carrinho para obter o carrinho atual
    private cartService: CartService,
    // Serviço de cupons para validar descontos
    private couponsService: CouponsService,
    // Serviço de produtos para ler dados caso precise
    private productsService: ProductsService,
    // Serviço de e-mail para enviar confirmações
    private emailService: EmailService,
    // Serviço do Stripe para criar o PaymentIntent de pagamentos com cartão
    private stripeService: StripeService,
    // Conexão com o banco de dados para gerenciar transações
    private dataSource: DataSource,
  ) { }

  // Cria um pedido a partir do carrinho do usuário utilizando Transaction para consistência e Locks para prevenir Race Conditions
  async create(
    user: User,
    createOrderDto: CreateOrderDto,
  ): Promise<CreateOrderResult> {
    const cart = await this.cartService.getCart(user.id);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('O carrinho está vazio');
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    // Validação prévia do cupom (fora da transação) apenas para dar um feedback rápido
    // e amigável ao usuário — a validação definitiva e o incremento de uso acontecem
    // dentro da transação, com lock, para evitar corrida no limite de uso (usageLimit)
    let discountAmount = 0;
    let couponId: string | undefined = undefined;
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

    if (createOrderDto.paymentMethod === PaymentMethod.PIX) {
      const pixDiscount = Math.round(subtotal * 0.05 * 100) / 100;
      discountAmount = Math.round((discountAmount + pixDiscount) * 100) / 100;
    }

    const shippingCost = subtotal > 200 ? 0 : 19.9;
    const total = subtotal - discountAmount + shippingCost;
    const isCardPayment = CARD_PAYMENT_METHODS.includes(
      createOrderDto.paymentMethod,
    );

    // Transação do Banco de Dados
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedOrder: Order;

    try {
      // Validar e Lockar os Produtos (Pessimistic Write)
      // Buscamos todos os produtos do carrinho de forma transacional e impedimos outras transações de modificá-los até concluirmos.
      const productIds = cart.items.map((i) => i.productId);
      const lockedProducts = await queryRunner.manager.find(Product, {
        where: { id: In(productIds) },
        lock: { mode: 'pessimistic_write' },
      });

      // Validações de Estoque Batch
      for (const cartItem of cart.items) {
        const product = lockedProducts.find((p) => p.id === cartItem.productId);
        if (!product) {
          throw new NotFoundException(`Produto com ID ${cartItem.productId} não encontrado.`);
        }
        if (product.stock < cartItem.quantity) {
          throw new BadRequestException(`Estoque insuficiente para o produto: ${product.name}`);
        }
        // Subtrai da entidade lockada em runtime
        product.stock -= cartItem.quantity;
      }

      // Salva a alteração de estoque dos produtos de uma só vez (batch save resolves N+1)
      await queryRunner.manager.save(Product, lockedProducts);

      // Se há cupom, incrementa o uso de forma atômica e condicional (o UPDATE só
      // afeta a linha se ainda não atingiu o limite) — evita que dois checkouts
      // simultâneos ultrapassem o usageLimit entre validar e incrementar
      if (couponId) {
        const applied = await this.couponsService.incrementUsageIfAllowed(
          couponId,
          queryRunner.manager,
        );
        if (!applied) {
          throw new BadRequestException('Este cupom atingiu o limite de uso');
        }
      }

      // Gera um número de pedido único — o sufixo aleatório evita colisão em
      // criações concorrentes sem precisar de lógica de retry
      const orderNumber = await this.generateOrderNumber(queryRunner.manager);

      // Criar a Ordem Base — cartão fica PENDING até o webhook do Stripe confirmar;
      // PIX/boleto mantêm o fluxo simulado atual (confirmados imediatamente)
      const order = this.ordersRepository.create({
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
        paymentStatus: isCardPayment ? PaymentStatus.PENDING : PaymentStatus.PAID,
      });

      savedOrder = await queryRunner.manager.save(Order, order);

      // Criar Itens do Pedido Base
      const orderItems = cart.items.map((cartItem) =>
        this.orderItemsRepository.create({
          orderId: savedOrder.id,
          productId: cartItem.productId,
          productName: cartItem.product.name,
          productImage: cartItem.product.imageUrl,
          unitPrice: cartItem.product.price,
          quantity: cartItem.quantity,
          total: Number(cartItem.product.price) * cartItem.quantity,
        }),
      );

      await queryRunner.manager.save(OrderItem, orderItems);

      // Esvazia o carrinho dentro da MESMA transação do pedido — se qualquer etapa
      // falhar depois, o rollback também restaura os itens do carrinho
      await queryRunner.manager.delete(CartItem, { cartId: cart.id });

      // Concluir transação para certificar integridade
      await queryRunner.commitTransaction();
    } catch (err) {
      // Em caso de falha em estoque nulo, bad request, ou falha no banco
      await queryRunner.rollbackTransaction();
      throw err; // Re-lança o erro (BadRequest, NotFound, etc) para a API responder
    } finally {
      await queryRunner.release(); // Libera conexão
    }

    // Recupera a visibilidade integral das relações
    const fullOrder = await this.findOne(savedOrder.id, user.id);

    // Pagamento com cartão: cria o PaymentIntent no Stripe e devolve o client_secret
    // para o frontend confirmar via Stripe Elements. O pedido já existe (PENDING);
    // se a chamada ao Stripe falhar aqui, o usuário pode tentar novamente o pagamento.
    let clientSecret: string | undefined;
    if (isCardPayment) {
      const paymentIntent = await this.stripeService.createPaymentIntent(
        Math.round(total * 100),
        savedOrder.id,
        savedOrder.orderNumber,
      );
      await this.ordersRepository.update(savedOrder.id, {
        paymentIntentId: paymentIntent.id,
      });
      clientSecret = paymentIntent.client_secret ?? undefined;
    } else {
      // PIX/boleto já nascem "pagos" no fluxo simulado atual — envia a confirmação
      this.emailService.sendOrderConfirmation(user, fullOrder).catch(() => { });
    }

    return { order: fullOrder, clientSecret };
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

  // Lista todos os pedidos com paginação e filtros
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

  // Atualiza o status de um pedido, validando se a transição faz sentido
  // (ex.: um pedido já entregue não pode voltar a "pendente")
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status !== status) {
      const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[order.status];
      if (!allowedNextStatuses.includes(status)) {
        throw new BadRequestException(
          `Não é possível mudar o status de "${order.status}" para "${status}"`,
        );
      }
    }

    // Atualiza o status do pedido
    order.status = status;
    const updatedOrder = await this.ordersRepository.save(order);

    // Notifica o cliente sobre a mudança de status por e-mail
    this.emailService
      .sendOrderStatusUpdate(order.user, updatedOrder)
      .catch(() => { });

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

  // Gera um número de pedido único e legível. Um sufixo aleatório curto é
  // adicionado para evitar colisões quando dois pedidos são criados no mesmo
  // instante (o contador sequencial sozinho poderia colidir sob concorrência)
  private async generateOrderNumber(manager: EntityManager): Promise<string> {
    const count = await manager.count(Order);
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    // Formata como ORD-20240315-000042-A1B2
    return `ORD-${dateStr}-${String(count + 1).padStart(6, '0')}-${randomSuffix}`;
  }
}
