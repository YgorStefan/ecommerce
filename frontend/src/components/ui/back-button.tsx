'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Se estivermos na home, não exibimos o botão voltar, 
  // pois não há uma página anterior coerente no contexto da tela inicial
  if (pathname === '/') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.back()}
      aria-label="Voltar para a página anterior"
      title="Voltar"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
