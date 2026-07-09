// Layout do painel administrativo com sidebar de navegação

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Folder,
  LogOut,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

// Links de navegação do painel admin
const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produtos', icon: Package },
  { href: '/admin/categories', label: 'Categorias', icon: Folder },
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
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  // Controla a sidebar em telas pequenas, onde ela vira um drawer sobreposto
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Redireciona usuários não-admin para a home — só decide após a hidratação do
  // estado persistido, evitando expulsar um admin válido logo após um refresh
  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  // Fecha o drawer automaticamente ao navegar para outra página admin
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (!hasHydrated || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const sidebarContent = (
    <>
      {/* Logo do admin */}
      <div className="p-6 border-b flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold">
          <Store className="h-5 w-5" />
          <span>Admin Panel</span>
        </Link>
        {/* Botão de fechar visível apenas no drawer mobile */}
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden text-muted-foreground hover:text-foreground"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar fixa em telas grandes; vira um drawer sobreposto em telas pequenas */}
      <aside
        className={cn(
          'w-64 bg-background border-r flex flex-col fixed top-0 left-0 h-full z-30 transition-transform duration-200',
          'lg:translate-x-0',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Camada escura atrás do drawer aberto no mobile */}
      {isMobileSidebarOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Conteúdo principal com margem para a sidebar apenas em telas grandes */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Barra superior visível apenas no mobile, com botão para abrir o menu */}
        <div className="lg:hidden sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-4 py-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Abrir menu"
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">Admin Panel</span>
        </div>

        <main className="flex-1 p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
