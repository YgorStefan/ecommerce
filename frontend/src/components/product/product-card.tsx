// product-card.tsx
// Card de exibição de produto na grade de listagem

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';
import { wishlistService } from '@/services/api';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // Adiciona o produto ao carrinho e exibe toast de feedback
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Evita que o clique navegue para a página do produto
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Faça login para adicionar ao carrinho');
      return;
    }

    try {
      await addItem(product.id);
      toast.success('Produto adicionado ao carrinho!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao adicionar ao carrinho');
    }
  };

  // Adiciona o produto à lista de desejos
  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Faça login para adicionar à lista de desejos');
      return;
    }

    try {
      await wishlistService.addItem(product.id);
      toast.success('Adicionado à lista de desejos!');
    } catch (error: any) {
      // Se o produto já está na wishlist, mostra mensagem específica
      if (error.response?.status === 409) {
        toast.info('Produto já está na sua lista de desejos');
      } else {
        toast.error('Erro ao adicionar à lista de desejos');
      }
    }
  };

  // Verifica se o produto está fora de estoque
  const isOutOfStock = product.stock <= 0;

  // Calcula o percentual de desconto se houver preço original
  const discountPercent = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    // Link que envolve todo o card para navegação para a página do produto
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative rounded-lg overflow-hidden border bg-card hover:shadow-md transition-shadow">
        {/* Container da imagem do produto */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            // Placeholder quando não há imagem do produto
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem imagem
            </div>
          )}

          {/* Badge de desconto no canto superior esquerdo */}
          {discountPercent && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-500">
              -{discountPercent}%
            </Badge>
          )}

          {/* Badge de sem estoque */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary">Fora de Estoque</Badge>
            </div>
          )}

          {/* Botão de favoritar — visível apenas ao passar o mouse */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
            onClick={handleAddToWishlist}
            aria-label="Adicionar à lista de desejos"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Informações do produto */}
        <div className="p-3 space-y-2">
          {/* Nome do produto */}
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Avaliação média em estrelas */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                {Number(product.averageRating).toFixed(1)} ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Preços */}
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base">{formatCurrency(Number(product.price))}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(Number(product.originalPrice))}
              </span>
            )}
          </div>

          {/* Botão de adicionar ao carrinho */}
          <Button
            size="sm"
            className="w-full"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isLoading}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            <ShoppingCart className="h-3 w-3 mr-1" aria-hidden="true" />
            {isOutOfStock ? 'Indisponível' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
