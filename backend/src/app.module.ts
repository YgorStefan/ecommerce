// Módulo raiz da aplicação

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';

// Importação de todos os módulos de domínio da aplicação
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { EmailModule } from './modules/email/email.module';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [
    // ConfigModule: carrega variáveis de ambiente de forma global
    ConfigModule.forRoot({
      isGlobal: true, // Disponível em todos os módulos sem necessidade de reimportar
      envFilePath: join(__dirname, '../../.env'), // Arquivo de variáveis de ambiente
    }),

    // ThrottlerModule: proteção contra ataques de força-bruta (Rate Limiting)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // Limita a 100 requisições por minuto por IP
    }]),

    // TypeOrmModule: configura a conexão com o banco de dados PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USER', 'ecommerce'),
        password: configService.get<string>('DB_PASSWORD', 'ecommerce123'),
        database: configService.get<string>('DB_NAME', 'ecommerce_db'),
        // Carrega automaticamente todas as entidades registradas nos módulos
        autoLoadEntities: true,
        // DB_SYNC=true apenas no primeiro deploy para criar as tabelas
        synchronize: configService.get<string>('DB_SYNC') === 'true',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // ServeStaticModule: serve os arquivos de upload estáticos
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Módulos de domínio da aplicação
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    WishlistModule,
    CouponsModule,
    EmailModule,
    ShippingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
