# E-commerce Full Stack

E-commerce completo e escalável construído com NestJS, Next.js e PostgreSQL.

## Tecnologias

### Backend
- **NestJS 10** — Framework Node.js modular e orientado a objeto
- **TypeORM** — ORM com suporte completo a TypeScript
- **PostgreSQL** — Banco de dados relacional robusto
- **JWT** — Autenticação stateless com access e refresh tokens
- **Passport.js** — Middleware de autenticação
- **Nodemailer** — Envio de e-mails transacionais
- **Swagger** — Documentação automática da API
- **class-validator** — Validação de DTOs

### Frontend
- **Next.js 14** — Framework React com App Router e Server Components
- **TypeScript** — Tipagem estática
- **Tailwind CSS** — Estilização utilitária
- **shadcn/ui** — Componentes acessíveis e customizáveis
- **Zustand** — Gerenciamento de estado global
- **TanStack Query** — Cache e sincronização de dados do servidor
- **React Hook Form + Zod** — Formulários com validação
- **Recharts** — Gráficos no painel admin

### Infraestrutura
- **Docker + Docker Compose** — Containerização dos serviços

## Estrutura do Projeto

```
ecommerce/
├── backend/          # API NestJS
├── frontend/         # App Next.js
├── docker-compose.yml
├── .env.example
└── README.md
```

## Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 20+ (para desenvolvimento local)

### Com Docker (Recomendado)

```bash
# 1. Clone o repositório e entre na pasta
cd ecommerce

# 2. Copie as variáveis de ambiente
cp .env.example .env

# 3. Edite o .env com suas configurações
# (especialmente as credenciais de e-mail)

# 4. Suba todos os serviços
docker-compose up --build

# A aplicação estará disponível em:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Swagger Docs: http://localhost:3001/api/docs
```

### Desenvolvimento Local

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Funcionalidades

### Loja
- Listagem de produtos com busca e filtros avançados (categoria, preço, ordenação)
- Página de detalhe do produto com galeria de imagens
- Carrinho de compras com drawer lateral
- Aplicação de cupons de desconto
- Checkout com endereço de entrega
- Confirmação de pedido por e-mail

### Conta do Usuário
- Cadastro e login com JWT
- Perfil do usuário
- Histórico de pedidos
- Lista de desejos (wishlist)
- Avaliações de produtos (reviews)

### Painel Admin
- Dashboard com métricas (vendas, pedidos, usuários, produtos)
- CRUD completo de produtos com upload de imagens
- Gestão de categorias
- Gestão e atualização de status de pedidos
- Gestão de usuários (ativar/desativar, promover a admin)
- Gestão de cupons (percentual ou valor fixo)

## API Endpoints Principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/register | Cadastro de usuário |
| POST | /auth/login | Login |
| POST | /auth/refresh | Renovar token |
| GET | /products | Listar produtos com filtros |
| GET | /products/:slug | Detalhe do produto |
| POST | /cart/items | Adicionar ao carrinho |
| POST | /orders | Criar pedido |
| GET | /orders/me | Meus pedidos |

Documentação completa: **http://localhost:3001/api/docs**

## Variáveis de Ambiente

Veja `.env.example` para todas as variáveis disponíveis.
