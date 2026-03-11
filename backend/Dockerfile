# Dockerfile do Backend NestJS
# Build multi-stage para reduzir o tamanho da imagem final

# ==================== STAGE 1: BUILD ====================
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências primeiro (melhor uso do cache do Docker)
COPY package*.json ./

# Instala todas as dependências incluindo as de desenvolvimento
RUN npm ci

# Copia o código fonte para o container
COPY . .

# Compila o TypeScript para JavaScript
RUN npm run build

# ==================== STAGE 2: PRODUÇÃO ====================
FROM node:20-alpine AS production

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala apenas as dependências de produção (menor tamanho)
RUN npm ci --only=production

# Copia o código compilado do stage de build
COPY --from=builder /app/dist ./dist

# Cria a pasta de uploads para armazenamento de imagens
RUN mkdir -p uploads/products

# Expõe a porta que o servidor NestJS vai escutar
EXPOSE 3001

# Comando para iniciar o servidor em produção
CMD ["node", "dist/main"]
