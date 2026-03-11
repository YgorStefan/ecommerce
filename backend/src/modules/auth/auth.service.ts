// auth.service.ts
// Serviço de autenticação — gerencia registro, login e tokens JWT

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    // Repositório do TypeORM para operações com a tabela users
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    // Repositório do carrinho para criar o carrinho inicial do usuário
    @InjectRepository(Cart)
    private cartsRepository: Repository<Cart>,
    // Serviço JWT para gerar e verificar tokens
    private jwtService: JwtService,
    // Serviço de configuração para acessar variáveis de ambiente
    private configService: ConfigService,
    // Serviço de e-mail para enviar confirmações
    private emailService: EmailService,
  ) {}

  // Registra um novo usuário no sistema
  async register(registerDto: RegisterDto) {
    // Verifica se já existe um usuário com o mesmo e-mail
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      // Lança exceção 409 Conflict se o e-mail já está em uso
      throw new ConflictException('E-mail já cadastrado');
    }

    // Gera o hash da senha com custo 10 (boa relação segurança/performance)
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Cria a instância do usuário com os dados do DTO
    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword, // Substitui a senha em texto plano pelo hash
    });

    // Salva o usuário no banco de dados
    const savedUser = await this.usersRepository.save(user);

    // Cria um carrinho vazio para o novo usuário automaticamente
    const cart = this.cartsRepository.create({ userId: savedUser.id });
    await this.cartsRepository.save(cart);

    // Envia e-mail de boas-vindas de forma assíncrona (não bloqueia o registro)
    this.emailService.sendWelcomeEmail(savedUser).catch(() => {
      // Ignora erros de e-mail para não afetar o fluxo de cadastro
    });

    // Gera os tokens de acesso e refresh para o novo usuário
    const tokens = await this.generateTokens(savedUser);

    // Salva o hash do refresh token no banco para validação futura
    await this.saveRefreshToken(savedUser.id, tokens.refreshToken);

    return {
      user: savedUser,
      ...tokens,
    };
  }

  // Autentica um usuário com e-mail e senha
  async login(loginDto: LoginDto) {
    // Busca o usuário pelo e-mail
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email, isActive: true },
    });

    // Rejeita se não encontrar usuário (mensagem genérica por segurança)
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Compara a senha fornecida com o hash armazenado
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gera novos tokens para a sessão
    const tokens = await this.generateTokens(user);

    // Atualiza o refresh token salvo no banco
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
  }

  // Renova o access token usando um refresh token válido
  async refreshTokens(userId: string, refreshToken: string) {
    // Busca o usuário pelo ID
    const user = await this.usersRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Acesso negado');
    }

    // Verifica se o refresh token fornecido corresponde ao armazenado
    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isTokenValid) {
      throw new UnauthorizedException('Token de renovação inválido');
    }

    // Gera um novo par de tokens
    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // Remove o refresh token do banco (efetua o logout)
  async logout(userId: string) {
    await this.usersRepository.update(userId, { refreshToken: null });
  }

  // Método privado que gera o par de tokens JWT (access + refresh)
  private async generateTokens(user: User) {
    // Payload comum para os dois tokens
    const payload = {
      sub: user.id,     // Subject: ID do usuário
      email: user.email,
      role: user.role,
    };

    // Gera o access token com validade curta (15 minutos por padrão)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    // Gera o refresh token com validade longa (7 dias por padrão)
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }

  // Método privado que salva o hash do refresh token no banco
  private async saveRefreshToken(userId: string, refreshToken: string) {
    // Faz o hash do refresh token antes de salvar (segurança adicional)
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, { refreshToken: hashedToken });
  }
}
