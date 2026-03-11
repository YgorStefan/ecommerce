// layout.tsx
// Layout raiz da aplicação — envolve todas as páginas com providers globais

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Carrega a fonte Inter do Google Fonts com subsets definidos
const inter = Inter({ subsets: ['latin'] });

// Metadados globais da aplicação para SEO
export const metadata: Metadata = {
  title: {
    default: 'E-commerce — Produtos de Qualidade',
    template: '%s | E-commerce', // Formato para títulos de páginas internas
  },
  description: 'Loja virtual com os melhores produtos. Entrega rápida e segura.',
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
        {/* Providers encapsula todos os provedores de contexto (React Query, Toast, etc.) */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
