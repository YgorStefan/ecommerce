// next.config.js
// Configuração do Next.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera uma pasta standalone com apenas os arquivos necessários para produção
  // Isso permite o build multi-stage no Docker (imagem menor)
  output: 'standalone',

  // Configuração de imagens externas permitidas
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
