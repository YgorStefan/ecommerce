'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Search, Menu, X, Heart, LogOut, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/ui/back-button';
import { SearchBar } from '@/components/search/search-bar';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  // Estados locais para controle da UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Obtém o estado de autenticação do store global
  const { user, isAuthenticated, logout } = useAuthStore();

  // Obtém o estado e ações do carrinho
  const { cart, toggleCart } = useCartStore();

  // Conta o total de itens no carrinho para o badge
  const itemCount = cart?.itemCount || 0;

  // Realiza logout e redireciona para a home
  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo da loja e botão voltar */}
          <div className="flex items-center gap-2">
            <BackButton />
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <Package className="h-6 w-6" />
              <span>E-commerce</span>
            </Link>
          </div>

          {/* Barra de busca — oculta em mobile */}
          <div className="hidden md:flex flex-1 max-w-sm justify-center">
            <SearchBar />
          </div>

          {/* Navegação e ações do header */}
          <nav className="flex items-center gap-2">
            {/* Botão da lista de desejos — apenas para usuários logados */}
            {isAuthenticated && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/account/wishlist" aria-label="Lista de desejos">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Botão do carrinho com badge de quantidade */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              className="relative"
              aria-label="Carrinho de compras"
            >
              <ShoppingCart className="h-5 w-5" />
              {/* Badge com a quantidade de itens no carrinho */}
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Button>

            {/* Menu do usuário — toggle baseado no estado de autenticação */}
            {isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="Menu do usuário"
                >
                  <User className="h-5 w-5" />
                </Button>

                {/* Dropdown do menu do usuário */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg z-50">
                    <div className="p-2 border-b">
                      <p className="text-sm font-medium truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      {/* Link para os pedidos do usuário */}
                      <Link
                        href="/account/orders"
                        className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Package className="h-4 w-4" />
                        Meus Pedidos
                      </Link>
                      {/* Link para o perfil do usuário */}
                      <Link
                        href="/account"
                        className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Meu Perfil
                      </Link>
                      {/* Link para o painel admin — apenas para admins */}
                      {user?.role === 'admin' && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Painel Admin
                        </Link>
                      )}
                      {/* Botão de logout */}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Botões de login e cadastro para usuários não autenticados
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Cadastrar</Link>
                </Button>
              </div>
            )}

            {/* Botão do menu mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </nav>
        </div>

        {/* Menu mobile expandido */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t pt-4 space-y-3">
            {/* Busca no mobile */}
            <div className="w-full flex justify-center">
              <SearchBar />
            </div>

            {/* Links de autenticação no mobile */}
            {!isAuthenticated && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/register">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
