// Página de detalhe do produto com galeria, avaliações e ações

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { productsService, reviewsService, wishlistService } from '@/services/api';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Review } from '@/types';
import { toast } from 'sonner';

interface ProductDetailPageProps {
  params: { slug: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = params;
  const queryClient = useQueryClient();
  const { addItem, isLoading: cartLoading } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  // Estados locais para controle da UI
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Busca os detalhes do produto pelo slug
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsService.getBySlug(slug),
    select: (res) => res.data.data,
  });

  // Busca as avaliações do produto
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: () => reviewsService.getByProduct(product!.id),
    enabled: !!product?.id, // Só busca quando tiver o ID do produto
    select: (res) => res.data.data,
  });

  // Mutation para criar uma nova avaliação
  const createReviewMutation = useMutation({
    mutationFn: (data: any) => reviewsService.create(data),
    onSuccess: () => {
      toast.success('Avaliação publicada com sucesso!');
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
      // Invalida o cache das avaliações e do produto para refletir a nova média
      queryClient.invalidateQueries({ queryKey: ['reviews', product?.id] });
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao publicar avaliação');
    },
  });

  // Adiciona o produto ao carrinho com a quantidade selecionada
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para comprar');
      return;
    }
    try {
      await addItem(product!.id, quantity);
      toast.success('Adicionado ao carrinho!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao adicionar ao carrinho');
    }
  };

  // Adiciona à lista de desejos
  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar à wishlist');
      return;
    }
    try {
      await wishlistService.addItem(product!.id);
      toast.success('Adicionado à lista de desejos!');
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.info('Produto já está na sua lista de desejos');
      } else {
        toast.error('Erro ao adicionar à lista de desejos');
      }
    }
  };

  // Envia o formulário de avaliação
  const handleSubmitReview = () => {
    createReviewMutation.mutate({
      productId: product!.id,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-muted rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-6 bg-muted rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    notFound();
  }

  // Obtém as imagens do produto (usa imageUrl como fallback)
  const allImages = product.images?.length > 0
    ? product.images.map((img: any) => img.url)
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  const currentImage = allImages[selectedImageIndex];
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Grade principal produto: imagem + detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/*  GALERIA DE IMAGENS  */}
        <div className="space-y-4">
          {/* Imagem principal */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Sem imagem
              </div>
            )}

            {/* Controles de navegação da galeria */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center"
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(Math.min(allImages.length - 1, selectedImageIndex + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center"
                  disabled={selectedImageIndex === allImages.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Miniaturas das imagens */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {allImages.map((url: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${idx === selectedImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/*  DETALHES DO PRODUTO  */}
        <div className="space-y-6">
          {/* Categoria */}
          {product.category && (
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
          )}

          {/* Nome do produto */}
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Avaliação média */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(Number(product.averageRating))
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {Number(product.averageRating).toFixed(1)} ({product.reviewCount} avaliações)
              </span>
            </div>
          )}

          {/* Preços */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatCurrency(Number(product.price))}</span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatCurrency(Number(product.originalPrice))}
              </span>
            )}
            {product.originalPrice && (
              <Badge className="bg-red-500">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </Badge>
            )}
          </div>

          {/* Disponibilidade em estoque */}
          <div>
            {isOutOfStock ? (
              <Badge variant="secondary">Fora de Estoque</Badge>
            ) : (
              <span className="text-sm text-green-600 font-medium">
                Em estoque ({product.stock} disponíveis)
              </span>
            )}
          </div>

          {/* Seletor de quantidade */}
          {!isOutOfStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Quantidade:</span>
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-accent"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 hover:bg-accent"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={isOutOfStock || cartLoading}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
            </Button>
            <Button variant="outline" size="lg" onClick={handleAddToWishlist}>
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Descrição do produto */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/*  SEÇÃO DE AVALIAÇÕES  */}
      <div className="border-t pt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Avaliações dos Clientes</h2>
          {isAuthenticated && (
            <Button
              variant="outline"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              Escrever Avaliação
            </Button>
          )}
        </div>

        {/* Formulário de nova avaliação */}
        {showReviewForm && (
          <div className="mb-8 p-6 rounded-lg border space-y-4">
            <h3 className="font-semibold">Sua Avaliação</h3>

            {/* Seletor de estrelas */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewRating(i + 1)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${i < reviewRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                      }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">{reviewRating}/5</span>
            </div>

            {/* Título da avaliação */}
            <input
              type="text"
              placeholder="Título da avaliação (opcional)"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            />

            {/* Comentário da avaliação */}
            <textarea
              placeholder="Escreva seu comentário..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
            />

            <div className="flex gap-3">
              <Button
                onClick={handleSubmitReview}
                disabled={createReviewMutation.isPending}
              >
                {createReviewMutation.isPending ? 'Publicando...' : 'Publicar Avaliação'}
              </Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de avaliações existentes */}
        {reviewsData?.reviews?.length > 0 ? (
          <div className="space-y-6">
            {reviewsData.reviews.map((review: Review) => (
              <div key={review.id} className="pb-6 border-b last:border-0">
                <div className="flex items-start gap-4">
                  {/* Avatar do avaliador */}
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium text-sm flex-shrink-0">
                    {review.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{review.user?.name}</p>
                        {/* Estrelas da avaliação */}
                        <div className="flex mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    {review.title && (
                      <p className="font-medium text-sm mt-2">{review.title}</p>
                    )}
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Este produto ainda não tem avaliações.</p>
            {isAuthenticated && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowReviewForm(true)}
              >
                Seja o primeiro a avaliar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
