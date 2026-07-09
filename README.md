# E-commerce Full Stack

E-commerce completo e escalável construído com NestJS, Next.js e MySQL, com pagamento por cartão via Stripe.

## Tecnologias

### Backend
- **NestJS 10** — Framework Node.js modular e orientado a objeto
- **TypeORM** — ORM com suporte completo a TypeScript
- **MySQL 8** — Banco de dados relacional
- **JWT** — Autenticação stateless com access e refresh tokens em cookies httpOnly
- **Passport.js** — Middleware de autenticação
- **Stripe** — Pagamento com cartão (PaymentIntent + webhook)
- **Nodemailer** — Envio de e-mails transacionais
- **Swagger** — Documentação automática da API (apenas fora de produção)
- **class-validator** — Validação de DTOs
- **@nestjs/throttler** — Rate limiting

### Frontend
- **Next.js 14** — Framework React com App Router e Server Components
- **TypeScript** — Tipagem estática
- **Tailwind CSS** — Estilização utilitária
- **shadcn/ui** — Componentes acessíveis e customizáveis
- **Zustand** — Gerenciamento de estado global
- **TanStack Query** — Cache e sincronização de dados do servidor
- **React Hook Form + Zod** — Formulários com validação
- **Stripe.js + Elements** — Coleta segura de dados de cartão no navegador
- **Recharts** — Gráficos no painel admin

### Infraestrutura e Qualidade
- **Docker + Docker Compose** — Containerização dos serviços
- **Jest + Supertest** — Testes unitários e E2E do backend
- **Playwright** — Testes E2E do frontend
- **k6** — Testes de carga
- **GitHub Actions** — Pipeline de CI

## Arquitetura

- **Backend (NestJS)** organizado em módulos por domínio (`auth`, `users`, `products`,
  `categories`, `cart`, `wishlist`, `orders`, `coupons`, `reviews`, `payments`, `shipping`,
  `email`). Filtro global de exceções e interceptor de log estruturado padronizam
  respostas e registram auditoria **sem nunca expor dados sensíveis**.
- **Autenticação** por JWT em cookies `httpOnly`. O refresh extrai o usuário do próprio
  token (não confia em `userId` do cliente). Endpoints de auth têm rate limiting estrito.
- **Proteção de rotas em camadas**: um `middleware.ts` (edge) barra o acesso a `/account/*`
  e `/admin/*` antes da renderização. Se `JWT_ACCESS_SECRET` estiver disponível no ambiente
  do frontend, o token é verificado criptograficamente no edge (inclusive o papel admin);
  caso contrário, faz checagem de presença do cookie. A autorização definitiva é sempre do
  backend, que valida token e papel em cada requisição.
- **Pagamentos**: pedidos com cartão criam um `PaymentIntent` no Stripe e retornam o
  `client_secret`; o cartão é confirmado no navegador via Stripe Elements (dados de cartão
  nunca passam pelo servidor). O status do pedido é atualizado via **webhook** do Stripe.
  PIX e boleto permanecem em fluxo simulado.
- **Frontend (Next.js)** consome a API; estado de sessão e carrinho em Zustand com
  hidratação segura (guardas de rota aguardam a reidratação para não expulsar usuários
  autenticados após um refresh).

```
ecommerce/
├── backend/                # API NestJS
│   ├── src/
│   │   ├── common/         # filtros, interceptors, guards, decorators
│   │   └── modules/        # módulos por domínio
│   └── test/               # E2E (supertest) + carga (k6, em test/load)
├── frontend/               # App Next.js
│   └── e2e/                # E2E do frontend (Playwright)
├── .github/workflows/ci.yml
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── README.md
```

## Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 20+ (para desenvolvimento local)
- Conta Stripe em modo teste (opcional, apenas para pagamento com cartão)

### Com Docker (Recomendado)

```bash
# 1. Entre na pasta do projeto
cd ecommerce

# 2. Copie as variáveis de ambiente e edite conforme necessário
cp .env.example .env

# 3. Suba todos os serviços
docker-compose up --build

# Frontend:     http://localhost:3000
# Backend API:  http://localhost:3001
# Swagger Docs: http://localhost:3001/api/docs  (indisponível em produção)
```

### Desenvolvimento Local

```bash
# Banco de dados de desenvolvimento (MySQL na porta 3308)
docker-compose -f docker-compose.dev.yml up -d

# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev
```

## Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste. As principais:

| Variável | Descrição |
|----------|-----------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexão com o MySQL |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Segredos dos tokens JWT |
| `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Validade dos tokens |
| `FRONTEND_URL` | Origem permitida no CORS e base dos links de e-mail |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe (modo teste) |
| `STRIPE_WEBHOOK_SECRET` | Segredo para validar a assinatura do webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chave pública do Stripe (usada no navegador) |
| `SHIPPING_ORIGIN_ZIP` | CEP de origem para cálculo de frete (Correios) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD` | SMTP para e-mails transacionais |

> **Segurança:** nunca comite o arquivo `.env` nem chaves reais. O repositório contém
> apenas `.env.example` com valores de placeholder.

### Webhook do Stripe (local)

```bash
stripe listen --forward-to localhost:3001/api/payments/webhook
# use o whsec_... exibido como STRIPE_WEBHOOK_SECRET
```

## Funcionalidades

### Loja
- Listagem de produtos com busca e filtros avançados (categoria, preço, ordenação)
- Página de detalhe do produto com galeria de imagens e avaliações
- Carrinho de compras com drawer lateral e cálculo de frete
- Aplicação de cupons de desconto
- Checkout com endereço de entrega e **pagamento com cartão (Stripe)**, PIX e boleto (simulados)
- Confirmação de pedido por e-mail

### Conta do Usuário
- Cadastro e login com JWT (cookies httpOnly)
- **Recuperação de senha** (esqueci a senha / redefinir com token por e-mail)
- Perfil do usuário e troca de senha
- Histórico e detalhe de pedidos
- Lista de desejos (wishlist)
- Avaliações de produtos (reviews)

### Painel Admin
- Dashboard com métricas (vendas, pedidos, usuários, produtos)
- CRUD completo de produtos com upload de imagens
- Gestão de categorias (bloqueia remoção com produtos vinculados)
- Gestão e atualização de status de pedidos (máquina de estados)
- Gestão de usuários (ativar/desativar, promover a admin)
- Gestão de cupons (percentual ou valor fixo)

## Testes

```bash
# Backend — testes unitários
cd backend && npm test

# Backend — testes E2E (requer MySQL de teste na porta 3307)
docker-compose -f docker-compose.dev.yml up -d   # sobe o MySQL de teste
cd backend && npm run test:e2e

# Frontend — testes E2E (Playwright). Sobe backend e frontend automaticamente
# em portas isoladas (3901/3900) apontando para o banco de teste
cd frontend && npm run test:e2e

# Carga (k6) — ver instruções detalhadas em backend/test/load/README.md
k6 run backend/test/load/products.load.js
```

O pipeline de CI (`.github/workflows/ci.yml`) roda lint, build, testes unitários,
E2E do backend e E2E do frontend a cada push/PR para `main`/`master`.

## API Endpoints Principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/register | Cadastro de usuário |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Renovar token |
| POST | /api/auth/forgot-password | Solicitar recuperação de senha |
| POST | /api/auth/reset-password | Redefinir senha com token |
| GET | /api/products | Listar produtos com filtros |
| GET | /api/products/:slug | Detalhe do produto |
| POST | /api/cart/items | Adicionar ao carrinho |
| POST | /api/orders | Criar pedido |
| GET | /api/orders/me | Meus pedidos |
| POST | /api/payments/webhook | Webhook do Stripe |

Documentação completa (fora de produção): **http://localhost:3001/api/docs**

## Limitações conhecidas

- O gráfico "Vendas por mês" do dashboard usa dados ilustrativos — ainda não há endpoint
  de série histórica de vendas na API.
- PIX e boleto são fluxos simulados (sem integração real de gateway).
- O fluxo de cartão foi implementado e testado com o Stripe em modo teste; use suas
  próprias chaves de teste para exercitá-lo ponta a ponta.
