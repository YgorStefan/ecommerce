# Dockerfile do Frontend Next.js — estágio único (mais simples e confiável)

FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies necessárias para o build)
RUN npm install

# Copia todo o código fonte
COPY . .

# Desabilita telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Executa o build de produção do Next.js
RUN npm run build

# Variáveis de ambiente de produção
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Chama o Next.js diretamente pelo Node — evita problema de PATH no Alpine
CMD ["node", "node_modules/next/dist/bin/next", "start"]
