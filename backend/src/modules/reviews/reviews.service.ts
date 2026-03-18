// reviews.service.ts
// Serviço que gerencia avaliações de produtos

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { CreateReviewDto } from './dto/create-review.dto';

export { CreateReviewDto };

@Injectable()
export class ReviewsService {
  constructor(
    // Repositório das avaliações
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    // Repositório dos produtos para atualizar a média de avaliações
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  // Cria uma avaliação para um produto
  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    // Verifica se o produto existe
    const product = await this.productsRepository.findOne({
      where: { id: createReviewDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verifica se o usuário já avaliou este produto (unique constraint)
    const existing = await this.reviewsRepository.findOne({
      where: { userId, productId: createReviewDto.productId },
    });

    if (existing) {
      throw new ConflictException('Você já avaliou este produto');
    }

    // Cria a avaliação
    const review = this.reviewsRepository.create({
      userId,
      ...createReviewDto,
    });

    const savedReview = await this.reviewsRepository.save(review);

    // Atualiza a média e o contador de avaliações do produto
    await this.updateProductRating(createReviewDto.productId);

    return savedReview;
  }

  // Lista as avaliações de um produto com paginação
  async findByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { reviews, total, page, lastPage: Math.ceil(total / limit) };
  }

  // Lista as avaliações do usuário logado
  async findByUser(userId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  // Remove uma avaliação (apenas o autor ou admin pode excluir)
  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const review = await this.reviewsRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    // Verifica se o usuário é o autor da avaliação ou um admin
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta avaliação',
      );
    }

    const productId = review.productId;
    await this.reviewsRepository.remove(review);

    // Recalcula a média do produto após a exclusão
    await this.updateProductRating(productId);
  }

  // Método privado que recalcula a média e o total de avaliações de um produto
  private async updateProductRating(productId: string): Promise<void> {
    // Usa aggregate SQL para calcular a média e o total de uma só vez
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.productId = :productId', { productId })
      .getRawOne();

    const averageRating = result.avgRating
      ? Math.round(Number(result.avgRating) * 100) / 100 // Arredonda para 2 casas
      : 0;
    const reviewCount = Number(result.count) || 0;

    // Atualiza os campos de rating no produto para leitura eficiente
    await this.productsRepository.update(productId, {
      averageRating,
      reviewCount,
    });
  }
}
