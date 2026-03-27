// Página da lista de desejos do usuário

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { wishlistService } from '@/services/api';
import { WishlistItem } from '@/types';
import { toast } from 'sonner';

export default function WishlistPage() {
  const queryClient = useQueryClient();

  // Busca os itens da lista de desejos
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.getAll(),
    select: (res) => res.data.data as WishlistItem[],
  });

  // Mutation para remover um item da wishlist
  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.removeItem(productId),
    onSuccess: () => {
      // Invalida o cache da wishlist para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removido da lista de desejos');
    },
    onError: () => {
      toast.error('Erro ao remover da lista de desejos');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lista de Desejos</h1>
        {items.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>

      {isLoading ? (
        // Skeleton de carregamento
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        // Grade de produtos na wishlist com botão de remover
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <ProductCard product={item.product} />
              {/* Botão de remover da wishlist sobreposto ao card */}
              <button
                onClick={() => removeMutation.mutate(item.productId)}
                className="absolute top-2 left-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors z-10"
                title="Remover da lista de desejos"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        // Estado vazio da wishlist
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Sua lista de desejos está vazia.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Explore os produtos e adicione os que desejar!
          </p>
        </div>
      )}
    </div>
  );
}
