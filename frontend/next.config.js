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
  
  // Configuração crítica para WSL2/Windows com Docker!
  // Como o sistema de arquivos do Windows não emite eventos nativos do Linux (inotify),
  // forçamos o Next.js a usar "polling" (verificar as pastas a cada segundo).
  webpack: (config, context) => {
    if (context.dev) {
      config.watchOptions = {
        poll: 1000, // Verifica alterações a cada 1 segundo
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
