// Módulo de autenticação — configura JWT e registra as dependências do módulo

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    // Registra as entidades que este módulo precisa acessar via TypeORM
    TypeOrmModule.forFeature([User, Cart]),

    // PassportModule configura o Passport para autenticação
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule configura o módulo JWT com as chaves do ambiente
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Chave secreta principal do access token
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),

    // Importa o módulo de e-mail para enviar confirmações
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // Registra a estratégia JWT do Passport
  ],
  // Exporta o AuthService e PassportModule para uso em outros módulos
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule { }
