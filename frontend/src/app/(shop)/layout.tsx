// (shop)/layout.tsx
// Layout da área da loja — inclui o Header, Footer e CartDrawer

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/cart/cart-drawer';

// Layout compartilhado por todas as páginas da loja (home, produtos, etc.)
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Flex column com min-height para footer sempre na parte inferior
    <div className="flex flex-col min-h-screen">
      {/* Cabeçalho fixo com navegação */}
      <Header />

      {/* Conteúdo principal da página */}
      <main className="flex-1">
        {children}
      </main>

      {/* Rodapé */}
      <Footer />

      {/* Drawer lateral do carrinho — renderizado no nível do layout para overlay correto */}
      <CartDrawer />
    </div>
  );
}
