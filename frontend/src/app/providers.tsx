'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';

// Props que aceita componentes filhos
interface ProvidersProps {
  children: React.ReactNode;
}

// Carrega o carrinho do servidor assim que a aplicação monta, caso a sessão
// persistida (localStorage) indique que o usuário já está autenticado
function CartHydrator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  // Cria o cliente do React Query uma única vez (evita recriação em cada render)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tempo que os dados ficam em cache antes de serem revalidados
            staleTime: 60 * 1000, // 1 minuto
            // Número de tentativas em caso de erro
            retry: 1,
          },
        },
      }),
  );

  return (
    // QueryClientProvider disponibiliza o cliente do React Query para todos os componentes
    <QueryClientProvider client={queryClient}>
      <CartHydrator />
      {children}
      {/* Toaster do Sonner para notificações toast em toda a aplicação */}
      <Toaster
        position="top-right"
        richColors       // Cores diferentes por tipo (success, error, info)
        closeButton      // Botão para fechar o toast manualmente
      />
    </QueryClientProvider>
  );
}
