// Dashboard com métricas e KPIs do e-commerce

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, ShoppingBag, Users, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ordersService, productsService, usersService } from '@/services/api';
import { formatCurrency } from '@/lib/utils';

// Componente de card de métrica do dashboard
function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  // Busca as estatísticas de vendas do endpoint dedicado
  const { data: salesStats } = useQuery({
    queryKey: ['admin-sales-stats'],
    queryFn: () => ordersService.getStats(),
    select: (res) => res.data.data as { totalRevenue: number; totalOrders: number; monthlyRevenue: number },
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn: () => ordersService.getAll({ page: 1, limit: 10 }),
    select: (res) => res.data.data,
  });

  const { data: usersStats } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: () => usersService.getAll({ page: 1, limit: 1 }),
    select: (res) => res.data.data,
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-stats'],
    queryFn: () => productsService.getAll({ page: 1, limit: 1 }),
    select: (res) => res.data.data,
  });

  // Dados simulados de vendas para o gráfico (em produção viria da API)
  const chartData = [
    { month: 'Jan', vendas: 4200 },
    { month: 'Fev', vendas: 5800 },
    { month: 'Mar', vendas: 4900 },
    { month: 'Abr', vendas: 7200 },
    { month: 'Mai', vendas: 6800 },
    { month: 'Jun', vendas: 8900 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu e-commerce</p>
      </div>

      {/*  CARDS DE MÉTRICAS  */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de pedidos */}
        <MetricCard
          title="Total de Pedidos"
          value={ordersData?.total || 0}
          description="Todos os pedidos"
          icon={ShoppingBag}
        />
        {/* Total de usuários */}
        <MetricCard
          title="Usuários Cadastrados"
          value={usersStats?.total || 0}
          description="Contas ativas"
          icon={Users}
        />
        {/* Total de produtos */}
        <MetricCard
          title="Produtos Ativos"
          value={productsData?.total || 0}
          description="No catálogo"
          icon={Package}
        />
        {/* Receita total obtida do endpoint de estatísticas */}
        <MetricCard
          title="Receita Total"
          value={salesStats ? formatCurrency(salesStats.totalRevenue) : 'R$ 0,00'}
          description={salesStats ? `R$ ${formatCurrency(salesStats.monthlyRevenue)} nos últimos 30 dias` : 'Carregando...'}
          icon={DollarSign}
        />
      </div>

      {/*  GRÁFICO DE VENDAS  */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              {/* Grade de fundo do gráfico */}
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              {/* Eixo X com os meses */}
              <XAxis dataKey="month" className="text-xs" />
              {/* Eixo Y com valores formatados */}
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              {/* Tooltip com formatação de moeda */}
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                contentStyle={{ borderRadius: '8px' }}
              />
              {/* Barras do gráfico */}
              <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/*  PEDIDOS RECENTES  */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersData?.orders?.length > 0 ? (
            <div className="space-y-3">
              {ordersData.orders.slice(0, 5).map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-mono text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(Number(order.total))}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum pedido ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
