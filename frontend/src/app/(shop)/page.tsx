// (shop)/page.tsx
// Página inicial da loja — hero, produtos em destaque e categorias otimizados com Suspense e Streaming

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';

// =================== BUSCA DE DADOS ===================

async function getFeaturedProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products?featured=true&limit=8`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.products || [];
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

// =================== SEÇÕES COM STREAMING (SUSPENSE) ===================

// Componente Wrapper para Produtos em Destaque
async function FeaturedProductsSection() {
  const featuredProducts = await getFeaturedProducts();

  if (featuredProducts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum produto em destaque no momento.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/products">Ver todos os produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {featuredProducts.map((product: any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Fallback de Loading para Produtos
function FeaturedProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

// Componente Wrapper para Categorias
async function CategoriesSection() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Categorias</h2>
          <Button variant="ghost" asChild>
            <Link href="/products">Ver tudo <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((category: any) => (
            <Link
              key={category.id}
              href={`/products?categoryId=${category.id}`}
              className="group flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-center"
            >
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesSkeleton() {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  );
}


// =================== PÁGINA PRINCIPAL ===================

export default function HomePage() {
  // Removido o Promise.all() bloqueante. Agora o Hero carrega instantaneamente
  // e as outras seções usam Streaming via Suspense.

  return (
    <div>
      {/* ==================== SEÇÃO HERO ==================== */}
      <section className="relative bg-gradient-to-br from-background to-muted py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Produtos de Qualidade
            <span className="block text-primary mt-2">Para Você</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra nossa coleção exclusiva de produtos selecionados com cuidado.
            Entrega rápida e garantia em todos os itens.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/products">
                Ver Todos os Produtos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/products?featured=true">Ver Destaques</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ==================== PRODUTOS EM DESTAQUE ==================== */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="relative flex items-center justify-center mb-8">
            <h2 className="text-3xl font-bold text-center">Destaques</h2>
            <div className="absolute right-0">
              <Button variant="outline" size="sm" asChild>
                <Link href="/products?featured=true">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <Suspense fallback={<FeaturedProductsSkeleton />}>
            <FeaturedProductsSection />
          </Suspense>
        </div>
      </section>

      {/* ==================== CATEGORIAS ==================== */}
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>

      {/* ==================== DIFERENCIAIS ==================== */}
      <section className="py-12 px-4 border-y bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Frete Grátis</p>
                <p className="text-xs text-muted-foreground">Acima de R$ 200</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Pagamento Seguro</p>
                <p className="text-xs text-muted-foreground">Dados criptografados</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Troca Garantida</p>
                <p className="text-xs text-muted-foreground">Até 30 dias</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Suporte 24h</p>
                <p className="text-xs text-muted-foreground">Atendimento sempre</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
