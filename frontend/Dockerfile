# Dockerfile do Frontend Next.js — Produção
# Build multi-stage: 3 stages para garantir a imagem final mais enxuta possível.
# IMPORTANTE: next.config.js DEVE ter `output: 'standalone'` para este Dockerfile funcionar.

# ==================== STAGE 1: DEPENDÊNCIAS ====================
FROM node:20-alpine AS deps

WORKDIR /app

# Copia manifests primeiro para aproveitar o cache de layers do Docker.
# O npm ci só roda novamente se package.json ou package-lock.json mudarem.
COPY package*.json ./

RUN npm ci

# ==================== STAGE 2: BUILD ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Reutiliza node_modules instalados no stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia o código fonte (apenas o que não está no .dockerignore)
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Gera o build de produção — gera a pasta .next/standalone
RUN npm run build

# ==================== STAGE 3: PRODUÇÃO ====================
FROM node:20-alpine AS production

# Usuário não-root para segurança — sem privilégios desnecessários em produção
RUN addgroup -S appgroup && adduser -S nextjs -G appgroup

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copia apenas os artefatos mínimos necessários para rodar:
# - public/: assets estáticos servidos diretamente
# - .next/standalone/: o servidor Next.js autônomo (inclui suas próprias node_modules)
# - .next/static/: assets do cliente (JS, CSS) referenciados pelo servidor
COPY --from=builder --chown=nextjs:appgroup /app/public ./public
COPY --from=builder --chown=nextjs:appgroup /app/.next/standalone ./
COPY --from=builder --chown=nextjs:appgroup /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ARG BUILD_DATE=unknown
ARG GIT_HASH=unknown
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_HASH}" \
      org.opencontainers.image.title="ecommerce-frontend"

CMD ["node", "server.js"]
