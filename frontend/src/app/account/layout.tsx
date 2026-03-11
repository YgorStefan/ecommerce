// account/layout.tsx
// Layout da área do usuário com sidebar de navegação

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/cart/cart-drawer';
import Link from 'next/link';
import { User, Package, Heart } from 'lucide-react';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar de navegação da conta */}
          <aside className="md:w-56 flex-shrink-0">
            <nav className="space-y-1">
              <Link
                href="/account"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <User className="h-4 w-4" />
                Meu Perfil
              </Link>
              <Link
                href="/account/orders"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Package className="h-4 w-4" />
                Meus Pedidos
              </Link>
              <Link
                href="/account/wishlist"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Heart className="h-4 w-4" />
                Lista de Desejos
              </Link>
            </nav>
          </aside>

          {/* Conteúdo da página */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
