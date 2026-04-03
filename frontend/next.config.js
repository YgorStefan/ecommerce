/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração de imagens externas permitidas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
