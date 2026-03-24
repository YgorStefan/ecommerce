import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { Providers } from './providers';
import { JsonLd } from '@/components/seo/json-ld';

// Carrega a fonte Inter do Google Fonts com subsets definidos
const inter = Inter({ subsets: ['latin'] });

// Metadados globais da aplicação para SEO
export const metadata: Metadata = {
  title: {
    default: 'E-commerce — Produtos de Qualidade',
    template: '%s | E-commerce Brasil', // Formato para títulos de páginas internas
  },
  description: 'Loja virtual com os melhores produtos. Entrega rápida e segura.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://seusite-ecommerce.com.br',
    siteName: 'E-commerce Brasil',
    title: 'E-commerce — Produtos de Qualidade',
    description: 'A melhor loja virtual com os melhores produtos. Entrega rápida e segura e garantia em todas as compras.',
    images: [
      {
        url: 'https://seusite-ecommerce.com.br/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'E-commerce Brasil',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-commerce — Produtos de Qualidade',
    description: 'Entrega rápida e segura.',
  },
  manifest: '/manifest.json', // Referência ao PWA manifest (Next.js intercepta isso mas é bom ter)
};

// Dados estruturados globais
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'E-commerce Brasil',
  url: 'https://seusite-ecommerce.com.br',
  logo: 'https://seusite-ecommerce.com.br/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+55-11-99999-9999',
    contactType: 'customer service',
  },
};

// Layout raiz que envolve toda a aplicação
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Analytics do Google (Third Parties Library) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        
        {/* Rich Snippets da Organização */}
        <JsonLd data={organizationJsonLd} />

        {/* Providers encapsula todos os provedores de contexto (React Query, Toast, etc.) */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
