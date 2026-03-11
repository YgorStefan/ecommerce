// (shop)/products/page.tsx
// Página de listagem de produtos com filtros, busca e paginação

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product/product-card';
import { productsService, categoriesService } from '@/services/api';
import { Category, Product } from '@/types';

// Componente interno que usa useSearchParams — deve ser envolvido em Suspense
function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Lê os filtros ativos da URL para manter estado ao navegar
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'created_desc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });

  // Busca as categorias para o filtro lateral
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
    select: (res) => res.data.data as Category[],
  });

  // Busca os produtos com os filtros ativos
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { search, categoryId, sortBy, page, priceRange }],
    queryFn: () =>
      productsService.getAll({
        search: search || undefined,
        categoryId: categoryId || undefined,
        sortBy: sortBy || undefined,
        page,
        limit: 12,
        minPrice: priceRange.min ? Number(priceRange.min) : undefined,
        maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
        featured: searchParams.get('featured') === 'true' || undefined,
      }),
    select: (res) => res.data.data,
  });

  // Atualiza a URL com os filtros ativos para compartilhamento
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    if (sortBy) params.set('sortBy', sortBy);
    if (page > 1) params.set('page', String(page));
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }, [search, categoryId, sortBy, page, priceRange]);

  // Reseta para a página 1 quando os filtros mudam
  const handleFilterChange = (action: () => void) => {
    action();
    setPage(1);
  };

  // Limpa todos os filtros ativos
  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setSortBy('created_desc');
    setPriceRange({ min: '', max: '' });
    setPage(1);
  };

  // Verifica se há algum filtro ativo
  const hasActiveFilters = search || categoryId || priceRange.min || priceRange.max;

  const products: Product[] = productsData?.products || [];
  const totalPages: number = productsData?.lastPage || 1;
  const total: number = productsData?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ==================== SIDEBAR DE FILTROS ==================== */}
        <aside className={`lg:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="space-y-6 sticky top-24">
            {/* Título dos filtros */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-muted-foreground">
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Filtro por categoria */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Categoria</p>
              <div className="space-y-1">
                {/* Opção "Todas" */}
                <button
                  onClick={() => handleFilterChange(() => setCategoryId(''))}
                  className={`w-full text-left text-sm px-3 py-2 rounded-md hover:bg-accent transition-colors ${!categoryId ? 'bg-accent font-medium' : ''}`}
                >
                  Todas as categorias
                </button>
                {/* Lista de categorias disponíveis */}
                {categoriesData?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleFilterChange(() => setCategoryId(cat.id))}
                    className={`w-full text-left text-sm px-3 py-2 rounded-md hover:bg-accent transition-colors ${categoryId === cat.id ? 'bg-accent font-medium' : ''}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por faixa de preço */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Faixa de Preço</p>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={priceRange.min}
                  onChange={(e) =>
                    handleFilterChange(() =>
                      setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                    )
                  }
                  className="h-8"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={priceRange.max}
                  onChange={(e) =>
                    handleFilterChange(() =>
                      setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                    )
                  }
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* ==================== LISTAGEM PRINCIPAL ==================== */}
        <div className="flex-1 min-w-0">
          {/* Barra de controles (busca, ordenação, filtro mobile) */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Campo de busca */}
            <Input
              type="search"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
              className="flex-1"
            />

            {/* Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(() => setSortBy(e.target.value))}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="created_desc">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name_asc">A-Z</option>
              <option value="rating">Melhor avaliado</option>
            </select>

            {/* Botão para abrir filtros no mobile */}
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Contagem de resultados */}
          <p className="text-sm text-muted-foreground mb-4">
            {total} produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>

          {/* Estado de carregamento */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-muted animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : products.length > 0 ? (
            // Grade de produtos
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            // Estado sem resultados
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhum produto encontrado.</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper com Suspense — exigido pelo Next.js 14 para páginas que usam useSearchParams
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-muted animate-pulse aspect-[3/4]" />
          ))}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
