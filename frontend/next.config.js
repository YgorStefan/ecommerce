// next.config.js
// Configuração do Next.js

/** @type {import('next').NextConfig} */
const nextConfig = {
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
