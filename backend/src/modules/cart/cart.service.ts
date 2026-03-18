// cart.service.ts
// Serviço que gerencia todas as operações do carrinho de compras

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CartService {
  constructor(
    // Repositório do carrinho
    @InjectRepository(Cart)
    private cartsRepository: Repository<Cart>,
    // Repositório dos itens do carrinho
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    // Repositório de produtos para verificar disponibilidade
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  // Obtém o carrinho do usuário logado (cria um se não existir)
  async getCart(
    userId: string,
  ): Promise<Cart & { subtotal: number; itemCount: number }> {
    let cart = await this.cartsRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.product.images'],
    });

    // Cria um carrinho vazio se o usuário ainda não tiver um
    if (!cart) {
      cart = await this.cartsRepository.save(
        this.cartsRepository.create({ userId }),
      );
    }

    // Calcula o subtotal somando (preço × quantidade) de cada item
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    // Conta o total de unidades no carrinho
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...cart, subtotal, itemCount };
  }

  // Adiciona um produto ao carrinho ou aumenta a quantidade se já existir
  async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    // Busca o produto para verificar existência e estoque
    const product = await this.productsRepository.findOne({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verifica se há estoque suficiente
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Estoque insuficiente. Disponível: ${product.stock} unidade(s)`,
      );
    }

    // Busca ou cria o carrinho do usuário
    let cart = await this.cartsRepository.findOne({ where: { userId } });
    if (!cart) {
      cart = await this.cartsRepository.save(
        this.cartsRepository.create({ userId }),
      );
    }

    // Verifica se o produto já está no carrinho
    const existingItem = await this.cartItemsRepository.findOne({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      // Se já existe, soma a quantidade ao invés de criar novo item
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${product.stock} unidade(s)`,
        );
      }
      await this.cartItemsRepository.update(existingItem.id, {
        quantity: newQuantity,
      });
    } else {
      // Cria um novo item no carrinho
      await this.cartItemsRepository.save(
        this.cartItemsRepository.create({
          cartId: cart.id,
          productId,
          quantity,
        }),
      );
    }

    // Retorna o carrinho atualizado
    return this.getCart(userId) as any;
  }

  // Atualiza a quantidade de um item no carrinho
  async updateItem(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<Cart> {
    // Busca o carrinho do usuário para verificar propriedade
    const cart = await this.cartsRepository.findOne({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    // Busca o item no carrinho
    const item = await this.cartItemsRepository.findOne({
      where: { id: itemId, cartId: cart.id },
      relations: ['product'],
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado no carrinho');
    }

    // Verifica estoque disponível para a nova quantidade
    if (quantity > item.product.stock) {
      throw new BadRequestException(
        `Estoque insuficiente. Disponível: ${item.product.stock} unidade(s)`,
      );
    }

    if (quantity <= 0) {
      // Se quantidade for zero ou negativa, remove o item
      await this.cartItemsRepository.remove(item);
    } else {
      // Atualiza a quantidade
      await this.cartItemsRepository.update(itemId, { quantity });
    }

    return this.getCart(userId) as any;
  }

  // Remove um item específico do carrinho
  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.cartsRepository.findOne({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    const item = await this.cartItemsRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado no carrinho');
    }

    await this.cartItemsRepository.remove(item);
    return this.getCart(userId) as any;
  }

  // Esvazia completamente o carrinho após a conclusão do pedido
  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartsRepository.findOne({ where: { userId } });
    if (cart) {
      // Remove todos os itens do carrinho
      await this.cartItemsRepository.delete({ cartId: cart.id });
    }
  }
}
