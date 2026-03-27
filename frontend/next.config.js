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

  // Headers estritos de Segurança Preventiva
  async headers() {
    return [
      {
        // Aplica para todas as rotas
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            // Política restrita base, permitindo scripts e styles seguros para Next.js no dev,
            // e bloqueando conexões externas não intencionais
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https: http:; font-src 'self' data:; connect-src 'self' https: http:"
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
