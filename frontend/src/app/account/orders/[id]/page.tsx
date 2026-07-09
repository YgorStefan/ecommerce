// Página de detalhe de um pedido do usuário autenticado

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ordersService } from '@/services/api';
import { formatCurrency, formatDateTime, getOrderStatusInfo } from '@/lib/utils';
import { Order } from '@/types';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  boleto: 'Boleto',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pagamento pendente',
  paid: 'Pago',
  failed: 'Pagamento falhou',
  refunded: 'Reembolsado',
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['my-order', orderId],
    queryFn: () => ordersService.getMyOrder(orderId),
    select: (res: any) => res.data.data as Order,
    enabled: Boolean(orderId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="h-40 rounded-lg border bg-muted animate-pulse" />
        <div className="h-40 rounded-lg border bg-muted animate-pulse" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground">Não foi possível carregar este pedido.</p>
        <Button variant="outline" asChild>
          <Link href="/account/orders">Voltar para meus pedidos</Link>
        </Button>
      </div>
    );
  }

  const statusInfo = getOrderStatusInfo(order.status);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/orders"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Meus Pedidos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Realizado em {formatDateTime(order.createdAt)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Itens do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-3 last:pb-0">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-muted-foreground">
                  {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                </p>
              </div>
              <span className="font-medium">{formatCurrency(Number(item.total))}</span>
            </div>
          ))}

          <div className="pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto{order.coupon ? ` (${order.coupon.code})` : ''}</span>
                <span>-{formatCurrency(Number(order.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>
                {Number(order.shippingCost) === 0 ? 'Grátis' : formatCurrency(Number(order.shippingCost))}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1.5 border-t">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p className="text-foreground font-medium">{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city} - {order.shippingAddress.state}</p>
            <p>CEP: {order.shippingAddress.zipCode}</p>
            <p>{order.shippingAddress.phone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Método: </span>
              {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
            </p>
            <p>
              <span className="text-muted-foreground">Status: </span>
              {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
