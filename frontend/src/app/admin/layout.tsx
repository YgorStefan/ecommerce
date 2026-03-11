// admin/layout.tsx
// Layout do painel administrativo com sidebar de navegação

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  LogOut,
  Menu,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

// Links de navegação do painel admin
const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produtos', icon: Package },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/coupons', label: 'Cupons', icon: Tag },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Redireciona usuários não-admin para a home
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar fixa do painel admin */}
      <aside className="w-64 bg-background border-r flex flex-col fixed top-0 left-0 h-full z-30">
        {/* Logo do admin */}
        <div className="p-6 border-b">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold">
            <Store className="h-5 w-5" />
            <span>Admin Panel</span>
          </Link>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 p-4 space-y-1">
          {adminNavLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                // Destaca o link ativo
                pathname === href
                  ? 'bg-accent font-medium'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Informações do usuário e logout na parte inferior */}
        <div className="p-4 border-t space-y-3">
          {/* Link para voltar à loja */}
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            <Store className="h-4 w-4" />
            Ver Loja
          </Link>

          {/* Informações do usuário admin */}
          <div className="px-3 py-2">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>

          {/* Botão de logout */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Conteúdo principal com margem para a sidebar */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
