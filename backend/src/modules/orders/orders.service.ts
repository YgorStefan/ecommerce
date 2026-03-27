// Serviço de pedidos — gerencia o checkout, atualização de status e histórico

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
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
import { Product } from '../products/entities/product.entity';

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
    // Serviço de produtos para ler dados caso precise
    private productsService: ProductsService,
    // Serviço de e-mail para enviar confirmações
    private emailService: EmailService,
    // Conexão com o banco de dados para gerenciar transações
    private dataSource: DataSource,
  ) { }

  // Cria um pedido a partir do carrinho do usuário utilizando Transaction para consistência e Locks para prevenir Race Conditions
  async create(user: User, createOrderDto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartService.getCart(user.id);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('O carrinho está vazio');
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

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
    const orderNumber = await this.generateOrderNumber();

    // Transação do Banco de Dados
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedOrder;

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

      // Criar a Ordem Base
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
        paymentStatus: PaymentStatus.PAID,
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

      // Concluir transação para certificar integridade
      await queryRunner.commitTransaction();
    } catch (err) {
      // Em caso de falha em estoque nulo, bad request, ou falha no banco
      await queryRunner.rollbackTransaction();
      throw err; // Re-lança o erro (BadRequest, NotFound, etc) para a API responder
    } finally {
      await queryRunner.release(); // Libera conexão
    }

    // Rotinas externas à transação de Integridade
    if (couponId) {
      await this.couponsService.incrementUsage(couponId);
    }
    await this.cartService.clearCart(user.id);

    // Recupera a visibilidade integral das relacões
    const fullOrder = await this.findOne(savedOrder.id, user.id);

    this.emailService.sendOrderConfirmation(user, fullOrder).catch(() => { });

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

  // Atualiza o status de um pedido
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);

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
