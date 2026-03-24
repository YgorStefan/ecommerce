'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aqui poderíamos enviar o erro para um serviço como Sentry
    console.error('Aplicação quebrou:', error);
  }, [error]);

  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-bold tracking-tight">Ops! Algo deu errado.</h2>
      <p className="text-muted-foreground max-w-md">
        Não foi possível carregar esta página. Tente novamente ou volte para a página inicial.
      </p>
      <div className="flex gap-4 mt-4">
        <Button onClick={() => reset()} variant="default">
          Tentar Novamente
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
}
