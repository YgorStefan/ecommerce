// (shop)/page.tsx
// Página inicial da loja — hero, produtos em destaque e categorias

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';

// Busca os produtos em destaque do servidor (Server Component)
async function getFeaturedProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products?featured=true&limit=8`,
      {
        next: { revalidate: 60 }, // Revalida o cache a cada 60 segundos
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.products || [];
  } catch {
    return [];
  }
}

// Busca as categorias ativas
async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
      next: { revalidate: 300 }, // Cache de 5 minutos para categorias
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

// Página inicial da loja
export default async function HomePage() {
  // Busca os dados em paralelo para melhor performance
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

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
          {/* CTAs do hero */}
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

      {/* ==================== DIFERENCIAIS ==================== */}
      <section className="py-12 px-4 border-y bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Card de diferencial: Frete Grátis */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Frete Grátis</p>
                <p className="text-xs text-muted-foreground">Acima de R$ 200</p>
              </div>
            </div>

            {/* Pagamento Seguro */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Pagamento Seguro</p>
                <p className="text-xs text-muted-foreground">Dados criptografados</p>
              </div>
            </div>

            {/* Troca Garantida */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Troca Garantida</p>
                <p className="text-xs text-muted-foreground">Até 30 dias</p>
              </div>
            </div>

            {/* Suporte */}
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

      {/* ==================== CATEGORIAS ==================== */}
      {categories.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Categorias</h2>
              <Button variant="ghost" asChild>
                <Link href="/products">Ver tudo <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            {/* Grade de categorias */}
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
      )}

      {/* ==================== PRODUTOS EM DESTAQUE ==================== */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Destaques</h2>
            <Button variant="ghost" asChild>
              <Link href="/products?featured=true">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredProducts.length > 0 ? (
            // Grade de produtos em destaque
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            // Estado quando não há produtos em destaque
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum produto em destaque no momento.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/products">Ver todos os produtos</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
