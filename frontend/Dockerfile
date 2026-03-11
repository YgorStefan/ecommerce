# Dockerfile do Frontend Next.js
# Build multi-stage: instala dependências e compila, depois copia apenas o necessário

# ==================== STAGE 1: DEPENDÊNCIAS ====================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

# Instala todas as dependências (devDeps são necessárias para o build do Next.js)
RUN npm ci

# ==================== STAGE 2: BUILD ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia as dependências instaladas no stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia o código fonte
COPY . .

# Desabilita telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Executa o build de produção do Next.js
RUN npm run build

# ==================== STAGE 3: PRODUÇÃO ====================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copia apenas os artefatos necessários para rodar em produção
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
