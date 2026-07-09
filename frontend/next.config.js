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
            // Política base. `script-src`/`style-src` mantêm 'unsafe-inline' porque o
            // Next.js injeta scripts/estilos inline (nonces exigiriam middleware dedicado).
            // Stripe.js e seus iframes precisam estar liberados em script-src/frame-src/
            // connect-src, senão o checkout com cartão é bloqueado pela CSP.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https: http:",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
            ].join('; '),
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
