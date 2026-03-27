// Serviço que gerencia todas as operações de produtos

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto, ProductSortBy } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    // Repositório para a entidade Product
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    // Repositório para imagens de produtos
    @InjectRepository(ProductImage)
    private productImagesRepository: Repository<ProductImage>,
  ) { }

  // Busca produtos com filtros avançados e paginação
  async findAll(queryDto: QueryProductDto) {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy,
      page = 1,
      limit = 12,
      featured,
    } = queryDto;

    // QueryBuilder permite construir queries SQL complexas de forma segura
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category') // JOIN com a tabela de categorias
      .leftJoinAndSelect('product.images', 'images') // JOIN com a tabela de imagens
      .where('product.isActive = :isActive', { isActive: true }) // Apenas produtos ativos
      .andWhere('product.deletedAt IS NULL'); // Exclui produtos com soft delete

    // Filtro de busca por texto no nome ou descrição
    if (search) {
      qb.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search)',
        { search: `%${search.toLowerCase()}%` }, // Busca case-insensitive
      );
    }

    // Filtro por categoria
    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Filtro de faixa de preço mínimo
    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    // Filtro de faixa de preço máximo
    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Filtro de produtos em destaque
    if (featured !== undefined) {
      qb.andWhere('product.isFeatured = :featured', { featured });
    }

    // Aplica a ordenação conforme o parâmetro sortBy
    switch (sortBy) {
      case ProductSortBy.PRICE_ASC:
        qb.orderBy('product.price', 'ASC');
        break;
      case ProductSortBy.PRICE_DESC:
        qb.orderBy('product.price', 'DESC');
        break;
      case ProductSortBy.NAME_ASC:
        qb.orderBy('product.name', 'ASC');
        break;
      case ProductSortBy.NAME_DESC:
        qb.orderBy('product.name', 'DESC');
        break;
      case ProductSortBy.RATING:
        qb.orderBy('product.averageRating', 'DESC');
        break;
      case ProductSortBy.CREATED_ASC:
        qb.orderBy('product.createdAt', 'ASC');
        break;
      default:
        // Padrão: mais recentes primeiro
        qb.orderBy('product.createdAt', 'DESC');
    }

    // Calcula o offset para paginação
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    // Executa a query e obtém os resultados com contagem total
    const [products, total] = await qb.getManyAndCount();

    return {
      products,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // Busca um produto pelo slug para a página de detalhe
  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { slug, isActive: true },
      relations: ['category', 'images', 'reviews', 'reviews.user'],
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  // Busca um produto pelo ID
  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'images'],
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  // Cria um novo produto e gera seu slug automaticamente
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Gera o slug único a partir do nome do produto
    let slug = slugify(createProductDto.name, {
      lower: true,
      strict: true,
      locale: 'pt',
    });

    // Verifica se já existe um produto com o mesmo slug e adiciona sufixo numérico se necessário
    const existingProduct = await this.productsRepository.findOne({
      where: { slug },
    });
    if (existingProduct) {
      // Adiciona timestamp para garantir unicidade do slug
      slug = `${slug}-${Date.now()}`;
    }

    const product = this.productsRepository.create({
      ...createProductDto,
      slug,
    });

    return this.productsRepository.save(product);
  }

  // Atualiza um produto existente
  async update(
    id: string,
    updateDto: Partial<CreateProductDto>,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Se o nome foi atualizado, regenera o slug
    if (updateDto.name && updateDto.name !== product.name) {
      const newSlug = slugify(updateDto.name, {
        lower: true,
        strict: true,
        locale: 'pt',
      });
      (updateDto as any).slug = newSlug;
    }

    Object.assign(product, updateDto);
    return this.productsRepository.save(product);
  }

  // Remove um produto com soft delete para manter o histórico de pedidos
  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.softRemove(product);
  }

  // Adiciona imagens a um produto existente
  async addImages(
    productId: string,
    images: { url: string; alt?: string; position?: number }[],
  ): Promise<Product> {
    const product = await this.findOne(productId);

    // Cria as entidades de imagem associadas ao produto
    const productImages = images.map((img, index) =>
      this.productImagesRepository.create({
        ...img,
        productId,
        // Usa a posição fornecida ou o índice como fallback
        position: img.position ?? product.images.length + index,
      }),
    );

    // Salva as novas imagens no banco
    await this.productImagesRepository.save(productImages);

    // Retorna o produto com as imagens atualizadas
    return this.findOne(productId);
  }

  // Remove uma imagem específica de um produto
  async removeImage(productId: string, imageId: string): Promise<void> {
    const image = await this.productImagesRepository.findOne({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    await this.productImagesRepository.remove(image);
  }

  // Atualiza o estoque de um produto (chamado ao confirmar pedidos)
  async updateStock(productId: string, quantity: number): Promise<void> {
    const product = await this.findOne(productId);

    const newStock = product.stock - quantity;
    if (newStock < 0) {
      throw new BadRequestException(
        `Estoque insuficiente para o produto: ${product.name}`,
      );
    }

    await this.productsRepository.update(productId, { stock: newStock });
  }

  // Retorna estatísticas de produtos para o painel admin
  async getStats() {
    const total = await this.productsRepository.count({
      where: { isActive: true },
    });

    // Busca os 5 produtos com menor estoque para alertas
    const lowStock = await this.productsRepository.find({
      where: { isActive: true },
      order: { stock: 'ASC' },
      take: 5,
    });

    return { total, lowStock };
  }
}
