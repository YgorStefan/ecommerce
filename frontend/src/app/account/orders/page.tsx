// Página de histórico de pedidos do usuário

'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ordersService } from '@/services/api';
import { formatCurrency, formatDateTime, getOrderStatusInfo } from '@/lib/utils';
import { Order } from '@/types';

export default function OrdersPage() {
  // Busca os pedidos do usuário autenticado
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersService.getMyOrders(),
    select: (res) => res.data.data,
  });

  const orders: Order[] = data?.orders || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meus Pedidos</h1>

      {isLoading ? (
        // Skeleton de carregamento
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        // Lista de pedidos
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getOrderStatusInfo(order.status);
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Número e data do pedido */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-semibold text-sm">
                        {order.orderNumber}
                      </span>
                      {/* Badge de status do pedido */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                    {/* Resumo dos itens do pedido */}
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                      {order.items.length > 0 && `: ${order.items[0].productName}${order.items.length > 1 ? ` e mais ${order.items.length - 1}` : ''}`}
                    </p>
                  </div>

                  {/* Valor total do pedido */}
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(Number(order.total))}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        // Estado vazio
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
          <Link href="/products" className="mt-4 inline-block text-primary hover:underline">
            Explorar produtos
          </Link>
        </div>
      )}
    </div>
  );
}
