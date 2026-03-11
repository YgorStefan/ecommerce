// categories.service.ts
// Serviço que gerencia as categorias de produtos

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Category } from './entities/category.entity';

export class CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
}

export class UpdateCategoryDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(
    // Repositório TypeORM para operações na tabela categories
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  // Retorna todas as categorias ativas para exibição na loja
  async findAll(includeInactive = false): Promise<Category[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.categoriesRepository.find({
      where,
      order: { name: 'ASC' }, // Ordena alfabeticamente
    });
  }

  // Busca uma categoria pelo ID
  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return category;
  }

  // Busca uma categoria pelo slug (para URLs amigáveis)
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { slug } });
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return category;
  }

  // Cria uma nova categoria e gera o slug automaticamente
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Gera o slug a partir do nome da categoria
    const slug = slugify(createCategoryDto.name, {
      lower: true,     // Converte para minúsculas
      strict: true,    // Remove caracteres especiais
      locale: 'pt',    // Trata caracteres do português (ç, ã, etc.)
    });

    // Verifica se já existe uma categoria com o mesmo nome/slug
    const existing = await this.categoriesRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      slug,
    });

    return this.categoriesRepository.save(category);
  }

  // Atualiza uma categoria existente
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Se o nome foi atualizado, regenera o slug
    if (updateCategoryDto.name) {
      const newSlug = slugify(updateCategoryDto.name, {
        lower: true,
        strict: true,
        locale: 'pt',
      });
      (updateCategoryDto as any).slug = newSlug;
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  // Remove uma categoria do banco
  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }
}
