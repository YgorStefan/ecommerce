// Página de confirmação de pedido após checkout bem-sucedido

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Componente interno que usa useSearchParams — deve ser envolvido em Suspense
function SuccessContent() {
  const searchParams = useSearchParams();
  // Obtém o número do pedido dos parâmetros da URL
  const orderNumber = searchParams.get('orderNumber');

  return (
    <div className="max-w-lg mx-auto text-center space-y-6">
      {/* Ícone de sucesso */}
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
      </div>

      {/* Título de confirmação */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Pedido Confirmado!</h1>
        {orderNumber && (
          <p className="text-muted-foreground">
            Número do pedido:{' '}
            <span className="font-mono font-semibold text-foreground">{orderNumber}</span>
          </p>
        )}
      </div>

      {/* Mensagem informativa */}
      <p className="text-muted-foreground">
        Seu pedido foi recebido e está sendo processado. Você receberá um
        e-mail de confirmação com os detalhes do pedido.
      </p>

      {/* Informações de próximos passos */}
      <div className="bg-muted/50 rounded-lg p-6 text-left space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Próximos Passos
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✓ E-mail de confirmação enviado</li>
          <li>⏳ Pedido sendo processado</li>
          <li>📦 Você será notificado quando for enviado</li>
        </ul>
      </div>

      {/* Botões de ação */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild>
          <Link href="/account/orders">
            Ver Meus Pedidos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">Continuar Comprando</Link>
        </Button>
      </div>
    </div>
  );
}

// Wrapper com Suspense — exigido pelo Next.js para páginas que usam useSearchParams
export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Suspense fallback={
        <div className="max-w-lg mx-auto text-center">
          <div className="h-20 w-20 rounded-full bg-muted animate-pulse mx-auto mb-4" />
          <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-pulse" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
