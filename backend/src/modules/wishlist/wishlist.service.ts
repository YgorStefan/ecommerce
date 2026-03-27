// Serviço que gerencia a lista de desejos do usuário

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class WishlistService {
  constructor(
    // Repositório dos itens da wishlist
    @InjectRepository(WishlistItem)
    private wishlistRepository: Repository<WishlistItem>,
    // Repositório de produtos para verificar existência
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) { }

  // Retorna todos os itens da lista de desejos do usuário
  async findAll(userId: string): Promise<WishlistItem[]> {
    return this.wishlistRepository.find({
      where: { userId },
      relations: ['product', 'product.images', 'product.category'],
      order: { createdAt: 'DESC' }, // Mais recentes primeiro
    });
  }

  // Adiciona um produto à lista de desejos
  async addItem(userId: string, productId: string): Promise<WishlistItem> {
    // Verifica se o produto existe
    const product = await this.productsRepository.findOne({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verifica se o produto já está na wishlist do usuário
    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      throw new ConflictException('Produto já está na lista de desejos');
    }

    // Cria e salva o item na wishlist
    const item = this.wishlistRepository.create({ userId, productId });
    return this.wishlistRepository.save(item);
  }

  // Remove um produto da lista de desejos
  async removeItem(userId: string, productId: string): Promise<void> {
    const item = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado na lista de desejos');
    }

    await this.wishlistRepository.remove(item);
  }

  // Verifica se um produto específico está na wishlist do usuário
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const item = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });
    return !!item;
  }
}
