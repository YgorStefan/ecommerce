import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const mockCartsRepo = { create: jest.fn(), save: jest.fn() };
  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
    verifyAsync: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn((key: string, fallback?: any) => fallback),
  };
  const mockEmailService = {
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: getRepositoryToken(Cart), useValue: mockCartsRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve lançar ConflictException se o e-mail já estiver cadastrado', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1' });

      await expect(
        service.register({
          name: 'João',
          email: 'joao@test.com',
          password: 'senha1234',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('deve criar usuário, carrinho vazio e retornar tokens', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      mockUsersRepo.create.mockReturnValue({ email: 'joao@test.com' });
      mockUsersRepo.save.mockResolvedValue({
        id: 'u1',
        email: 'joao@test.com',
        name: 'João',
      });
      mockCartsRepo.create.mockReturnValue({ userId: 'u1' });
      mockCartsRepo.save.mockResolvedValue({ id: 'c1', userId: 'u1' });

      const result = await service.register({
        name: 'João',
        email: 'joao@test.com',
        password: 'senha1234',
      } as any);

      expect(mockCartsRepo.save).toHaveBeenCalled();
      expect(result.user.id).toBe('u1');
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      // O hash do refresh token deve ser persistido no usuário
      expect(mockUsersRepo.update).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ refreshToken: expect.any(String) }),
      );
    });
  });

  describe('login', () => {
    it('deve lançar UnauthorizedException se o usuário não existir', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@test.com', password: 'senha1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se a senha estiver incorreta', async () => {
      const hashed = await bcrypt.hash('senhaCorreta', 10);
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'joao@test.com',
        password: hashed,
      });

      await expect(
        service.login({ email: 'joao@test.com', password: 'senhaErrada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve autenticar com sucesso e retornar tokens', async () => {
      const hashed = await bcrypt.hash('senhaCorreta', 10);
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'joao@test.com',
        password: hashed,
      });

      const result = await service.login({
        email: 'joao@test.com',
        password: 'senhaCorreta',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.id).toBe('u1');
    });
  });

  describe('refreshTokens', () => {
    it('deve rejeitar um token com assinatura inválida', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(service.refreshTokens('token-invalido')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve rejeitar se o usuário não tiver refresh token salvo', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'u1' });
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', refreshToken: null });

      await expect(service.refreshTokens('token-valido')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve rejeitar se o token não corresponder ao hash salvo', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'u1' });
      const storedHash = await bcrypt.hash('outro-token', 10);
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        refreshToken: storedHash,
      });

      await expect(service.refreshTokens('token-valido')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve gerar novos tokens quando o refresh token é válido', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'u1' });
      const storedHash = await bcrypt.hash('token-valido', 10);
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        refreshToken: storedHash,
      });

      const result = await service.refreshTokens('token-valido');

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
    });
  });

  describe('forgotPassword', () => {
    it('não deve lançar erro e não deve enviar e-mail se o usuário não existir', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      await service.forgotPassword('naoexiste@test.com');

      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('deve gerar token, salvar o hash e enviar o e-mail se o usuário existir', async () => {
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'joao@test.com',
        name: 'João',
      });

      await service.forgotPassword('joao@test.com');

      expect(mockUsersRepo.update).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          resetPasswordTokenHash: expect.any(String),
          resetPasswordExpires: expect.any(Date),
        }),
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('deve lançar BadRequestException se o token for inválido ou expirado', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('token-invalido', 'novaSenha123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve redefinir a senha e invalidar o refresh token existente', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1' });

      await service.resetPassword('token-valido', 'novaSenha123');

      expect(mockUsersRepo.update).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          password: expect.any(String),
          resetPasswordTokenHash: null,
          resetPasswordExpires: null,
          refreshToken: null,
        }),
      );
    });
  });
});
