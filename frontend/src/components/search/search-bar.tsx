'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const debouncedQuery = useDebounce(query, 400); // 400ms delay
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora do componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca os dados quando o termo "debounced" muda
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const fetchSearchResults = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.data?.products || []);
        }
      } catch (error) {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearchResults();
  }, [debouncedQuery]);

  // Navega para a página inteira de resultados
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsFocused(false);
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
          {isSearching ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Input
          type="search"
          placeholder="Buscar produtos..."
          className="pl-9 pr-4 w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          autoComplete="off"
        />
      </form>

      {/* Dropdown de Resultados ao Vivo */}
      {isFocused && query.trim() !== '' && (
        <div className="absolute top-full mt-2 w-full rounded-md border bg-background shadow-lg z-50 overflow-hidden">
          {results.length > 0 ? (
            <div className="py-2">
              <div className="px-3 pb-2 text-xs font-medium text-muted-foreground border-b">
                Resultados Rápidos
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-accent transition-colors"
                      onClick={() => setIsFocused(false)}
                    >
                      <div className="relative h-12 w-12 rounded bg-muted flex-shrink-0">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name} fill className="object-cover rounded" />
                        ) : (
                          <div className="h-full w-full bg-secondary rounded" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium truncate">{product.name}</span>
                        <span className="text-sm text-primary">{formatCurrency(Number(product.price))}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t bg-muted/20">
                <Button variant="ghost" className="w-full text-xs" onClick={handleSubmit}>
                  Ver todos os resultados
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {isSearching ? 'Buscando...' : 'Nenhum produto encontrado.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
