// admin/orders/page.tsx
// Painel admin — gestão e atualização de status de pedidos

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ordersService } from '@/services/api';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDateTime, getOrderStatusInfo } from '@/lib/utils';
import { toast } from 'sonner';

// Próximos status possíveis para cada estado do pedido
const nextStatusMap: Record<string, { value: OrderStatus; label: string }[]> = {
  pending: [{ value: 'processing', label: 'Iniciar Processamento' }],
  processing: [{ value: 'shipped', label: 'Marcar como Enviado' }],
  shipped: [{ value: 'delivered', label: 'Marcar como Entregue' }],
  delivered: [],
  cancelled: [],
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Busca os pedidos com filtro de status
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () =>
      ordersService.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
      }),
    select: (res) => res.data.data,
  });

  const orders: Order[] = data?.orders || [];
  const totalPages: number = data?.lastPage || 1;

  // Mutation para atualizar o status de um pedido
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar o status');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos da loja</p>
      </div>

      {/* Filtro de status */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
          >
            {status === '' ? 'Todos' : getOrderStatusInfo(status).label}
          </Button>
        ))}
      </div>

      {/* Tabela de pedidos */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-2">
              {orders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status);
                const isExpanded = expandedOrderId === order.id;
                const nextStatuses = nextStatusMap[order.status] || [];

                return (
                  <div key={order.id} className="border rounded-lg overflow-hidden">
                    {/* Linha principal do pedido */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-mono font-semibold text-sm">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">{(order.user as any)?.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.length || 0} itens
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Badge de status */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <p className="font-bold">{formatCurrency(Number(order.total))}</p>
                      </div>
                    </div>

                    {/* Detalhes expandidos do pedido */}
                    {isExpanded && (
                      <div className="border-t p-4 bg-muted/30 space-y-4">
                        {/* Itens do pedido */}
                        <div>
                          <p className="text-sm font-medium mb-2">Itens do Pedido</p>
                          <div className="space-y-1">
                            {order.items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.productName} × {item.quantity}</span>
                                <span>{formatCurrency(Number(item.total))}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Endereço de entrega */}
                        {order.shippingAddress && (
                          <div>
                            <p className="text-sm font-medium mb-1">Endereço de Entrega</p>
                            <p className="text-sm text-muted-foreground">
                              {order.shippingAddress.name}<br />
                              {order.shippingAddress.address}<br />
                              {order.shippingAddress.city} - {order.shippingAddress.state}, {order.shippingAddress.zipCode}
                            </p>
                          </div>
                        )}

                        {/* Resumo financeiro */}
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCurrency(Number(order.subtotal))}</span>
                          </div>
                          {Number(order.discountAmount) > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Desconto</span>
                              <span>-{formatCurrency(Number(order.discountAmount))}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frete</span>
                            <span>{formatCurrency(Number(order.shippingCost))}</span>
                          </div>
                          <div className="flex justify-between font-bold pt-1 border-t">
                            <span>Total</span>
                            <span>{formatCurrency(Number(order.total))}</span>
                          </div>
                        </div>

                        {/* Botões de atualização de status */}
                        {nextStatuses.length > 0 && (
                          <div className="flex gap-2">
                            {nextStatuses.map(({ value, label }) => (
                              <Button
                                key={value}
                                size="sm"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: order.id, status: value })
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                {label}
                              </Button>
                            ))}
                            {/* Opção de cancelar o pedido */}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: order.id, status: 'cancelled' })
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                Cancelar Pedido
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado.</p>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
