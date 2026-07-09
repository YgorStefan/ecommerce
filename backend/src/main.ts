// Ponto de entrada da aplicação NestJS
// Configura o servidor HTTP, validação global, Swagger e CORS

import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  // Cria a instância da aplicação NestJS. `rawBody: true` mantém o corpo bruto da
  // requisição disponível em `req.rawBody`, necessário para validar a assinatura
  // HMAC dos webhooks do Stripe (POST /api/payments/webhook)
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Obtém o serviço de configuração para ler variáveis de ambiente
  const configService = app.get(ConfigService);

  // Define o prefixo global para todas as rotas da API
  app.setGlobalPrefix('api');

  // Adiciona cookie parser
  app.use(cookieParser());

  // Adiciona proteção de headers HTTP com Helmet
  app.use(helmet({
    crossOriginResourcePolicy: false, // Permite que imagens do backend sejam servidas para o frontend
  }));

  // Habilita CORS para permitir requisições do frontend
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true, // Permite o envio de cookies e headers de autenticação
  });

  // Registra o filtro global de exceções (loga erros sem vazar dados sensíveis)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Registra os interceptors globais:
  // - ClassSerializerInterceptor remove campos com @Exclude() (senha, refreshToken) de QUALQUER
  //   entidade retornada, incluindo quando aninhada dentro do TransformInterceptor.
  // - TransformInterceptor padroniza o formato das respostas de sucesso.
  // A ordem importa: como o Reflector é passado explicitamente, o ClassSerializerInterceptor
  // processa o resultado já envolvido pelo TransformInterceptor.
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
  );

  // Configura o pipe de validação global para todos os DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não declaradas nos DTOs
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
      transform: true, // Transforma automaticamente os tipos
      transformOptions: {
        enableImplicitConversion: true, // Permite conversão implícita de tipos
      },
    }),
  );

  // Configura a documentação Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('Documentação completa da API do E-commerce')
    .setVersion('1.0')
    .addBearerAuth() // Adiciona suporte ao JWT no Swagger UI
    .build();

  // Cria o documento Swagger a partir da configuração
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Disponibiliza a documentação apenas fora de produção, para não expor a superfície
  // completa da API publicamente
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  if (!isProduction) {
    SwaggerModule.setup('api/docs', app, document);
  }

  // Obtém a porta do servidor das variáveis de ambiente
  const port = configService.get<number>('BACKEND_PORT', 3001);

  // Inicia o servidor na porta configurada
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Backend rodando em: http://localhost:${port}/api`);
  if (!isProduction) {
    logger.log(`Swagger disponível em: http://localhost:${port}/api/docs`);
  }
}

// Executa a função de inicialização
bootstrap();
