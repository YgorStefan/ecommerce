# E-commerce Backend API

API REST do e-commerce construída com [NestJS](https://nestjs.com/) e TypeScript.

## Tecnologias

- **NestJS** — framework Node.js
- **TypeORM** — ORM com suporte a migrations
- **PostgreSQL** — banco de dados relacional
- **JWT** — autenticação com access + refresh token
- **Swagger** — documentação automática da API (`/api`)
- **Nodemailer** — envio de e-mails transacionais
- **Multer** — upload de imagens
- **Correios Brasil** — cálculo de frete

## Módulos

| Módulo | Descrição |
|---|---|
| `auth` | Registro, login, refresh token e JWT |
| `users` | Gerenciamento de usuários |
| `products` | Produtos com imagens, estoque e slugs |
| `categories` | Categorias de produtos |
| `cart` | Carrinho de compras por usuário |
| `orders` | Pedidos e itens de pedido |
| `coupons` | Cupons de desconto |
| `reviews` | Avaliações de produtos |
| `wishlist` | Lista de desejos |
| `shipping` | Cálculo de frete via Correios |
| `email` | Envio de e-mails com templates Handlebars |

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp ../.env.example .env
```

Variáveis necessárias:

| Variável | Descrição |
|---|---|
| `DB_HOST` | Host do PostgreSQL |
| `DB_PORT` | Porta do PostgreSQL (padrão: `5432`) |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_NAME` | Nome do banco de dados |
| `BACKEND_PORT` | Porta da API (padrão: `3001`) |
| `JWT_ACCESS_SECRET` | Segredo do access token |
| `JWT_REFRESH_SECRET` | Segredo do refresh token |
| `JWT_ACCESS_EXPIRES_IN` | Expiração do access token (ex: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token (ex: `7d`) |
| `FRONTEND_URL` | URL do frontend (para CORS e e-mails) |
| `MAIL_HOST` | Servidor SMTP |
| `MAIL_PORT` | Porta SMTP |
| `MAIL_USER` | Usuário do e-mail |
| `MAIL_PASSWORD` | Senha ou app password |
| `MAIL_FROM` | Remetente padrão |
| `UPLOAD_DEST` | Pasta de uploads (padrão: `./uploads`) |
| `MAX_FILE_SIZE` | Tamanho máximo de arquivo em bytes |

## Executar o projeto

```bash
# desenvolvimento com hot reload
npm run start:dev

# produção
npm run start:prod

# modo debug
npm run start:debug
```

## Migrations

```bash
# gerar migration a partir das entidades
npm run migration:generate

# executar migrations pendentes
npm run migration:run

# reverter última migration
npm run migration:revert
```

## Testes

```bash
# testes unitários
npm run test

# testes em modo watch
npm run test:watch

# cobertura de testes
npm run test:cov

# testes e2e
npm run test:e2e
```

## Documentação da API

Com o servidor rodando, acesse:

```
http://localhost:3001/api
```

## Docker

Build e execução isolada do backend:

```bash
docker build -t ecommerce-backend .
docker run -p 3001:3001 --env-file .env ecommerce-backend
```

Para subir toda a stack (backend + frontend + banco), use o `docker-compose` na raiz do projeto.

## Lint e formatação

```bash
npm run lint
npm run format
```
