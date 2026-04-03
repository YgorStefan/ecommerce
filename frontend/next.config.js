/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prefixo de caminho para rodar em /ecommerce na Hostinger
  basePath: '/ecommerce',

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

  // Proxy reverso: repassa chamadas de API e uploads do browser para o NestJS local
  // O browser chama ygorstefan.com/ecommerce/api/* e o Next.js encaminha para localhost:3001
  async rewrites() {
    const backendUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/ecommerce/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/ecommerce/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
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
