// Layout da área do usuário com sidebar de navegação

'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, Heart } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const accountNavLinks = [
  { href: '/account', label: 'Meu Perfil', icon: User },
  { href: '/account/orders', label: 'Meus Pedidos', icon: Package },
  { href: '/account/wishlist', label: 'Lista de Desejos', icon: Heart },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  // A área de conta exige autenticação — redireciona visitantes para o login.
  // Só decide após a hidratação do estado persistido, para não expulsar um
  // usuário já autenticado logo após um refresh de página (condição de corrida)
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar de navegação da conta */}
          <aside className="md:w-56 flex-shrink-0">
            <nav className="space-y-1">
              {accountNavLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                    pathname === href ? 'bg-accent font-medium' : 'text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
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
