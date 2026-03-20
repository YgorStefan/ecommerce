# Dockerfile do Backend NestJS — Produção
# Build multi-stage: compila o TypeScript e gera apenas o necessário na imagem final.
# By design, apenas a pasta dist/ e as prod dependencies vão para a imagem de produção.

# ==================== STAGE 1: BUILDER ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia manifests primeiro — o Docker só invalida esta layer se package.json ou
# package-lock.json mudarem, mantendo o cache de npm ci intacto para builds subsequentes.
COPY package*.json ./

# Instala TODAS as dependências (incluindo devDeps necessárias para o tsc)
RUN npm ci

# Copia o restante do código (apenas o que não está no .dockerignore)
COPY . .

# Compila TypeScript → JavaScript
RUN npm run build

# ==================== STAGE 2: PRODUÇÃO ====================
FROM node:20-alpine AS production

# Roda como usuário não-root por segurança — boa prática obrigatória em produção
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copia manifests para instalar apenas as prod dependencies
COPY package*.json ./

# --omit=dev garante que devDependencies não entrem na imagem final
RUN npm ci --omit=dev && npm cache clean --force

# Copia o código compilado do stage builder
COPY --from=builder /app/dist ./dist

# Cria a pasta de uploads com permissões corretas para o usuário não-root
RUN mkdir -p uploads/products && chown -R appuser:appgroup /app

# Muda para o usuário não-root antes de iniciar o processo
USER appuser

# Documenta a porta exposta (não publica — isso é responsabilidade do docker-compose)
EXPOSE 3001

# ARG recebida do docker-compose build args — usada apenas como label de rastreabilidade,
# não invalida a layer de npm ci (que é o que queremos preservar em cache)
ARG BUILD_DATE=unknown
ARG GIT_HASH=unknown
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_HASH}" \
      org.opencontainers.image.title="ecommerce-backend"

CMD ["node", "dist/main"]
