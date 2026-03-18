// users.service.ts
// Serviço que gerencia as operações de usuários no banco de dados

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UpdateUserDto, AdminUpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    // Repositório TypeORM para operações na tabela users
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Busca todos os usuários — apenas para uso administrativo
  async findAll(page = 1, limit = 20) {
    // Calcula o offset para paginação
    const skip = (page - 1) * limit;

    // Retorna os usuários com contagem total para paginação
    const [users, total] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' }, // Ordena do mais recente para o mais antigo
    });

    return {
      users,
      total,
      page,
      lastPage: Math.ceil(total / limit), // Calcula o número total de páginas
    };
  }

  // Busca um usuário pelo ID
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    // Lança exceção 404 se o usuário não for encontrado
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  // Busca um usuário pelo e-mail (usado internamente por outros serviços)
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Atualiza o perfil do usuário autenticado
  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    // Verifica se o usuário existe antes de atualizar
    await this.findOne(userId);

    // Atualiza apenas os campos fornecidos no DTO
    await this.usersRepository.update(userId, updateUserDto);

    // Retorna o usuário atualizado
    return this.findOne(userId);
  }

  // Altera a senha do usuário após validar a senha atual
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOne(userId);

    // Verifica se a senha atual está correta antes de alterar
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ForbiddenException('Senha atual incorreta');
    }

    // Gera o hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(userId, { password: hashedPassword });
  }

  // Atualização administrativa de usuário (pode alterar role e status)
  async adminUpdate(
    id: string,
    adminUpdateDto: AdminUpdateUserDto,
  ): Promise<User> {
    await this.findOne(id); // Verifica se existe
    await this.usersRepository.update(id, adminUpdateDto);
    return this.findOne(id);
  }

  // Realiza o soft delete do usuário (marca deletedAt sem remover do banco)
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    // softRemove usa o campo deletedAt do TypeORM
    await this.usersRepository.softRemove(user);
  }

  // Retorna estatísticas de usuários para o painel admin
  async getStats() {
    // Conta o total de usuários ativos
    const total = await this.usersRepository.count({
      where: { isActive: true },
    });

    // Conta novos usuários dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :date', { date: thirtyDaysAgo })
      .getCount();

    return { total, newUsers };
  }
}
