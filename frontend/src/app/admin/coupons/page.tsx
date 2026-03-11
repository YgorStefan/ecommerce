// admin/coupons/page.tsx
// Painel admin — criação e gestão de cupons de desconto

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { couponsService } from '@/services/api';
import { Coupon } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Estado do formulário de cupom
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumOrderValue: '',
    maximumDiscount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    isActive: true,
  });

  // Busca todos os cupons
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponsService.getAll(),
    select: (res) => res.data.data as Coupon[],
  });

  // Mutation para criar cupom
  const createMutation = useMutation({
    mutationFn: (data: any) => couponsService.create(data),
    onSuccess: () => {
      toast.success('Cupom criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      closeForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar cupom');
    },
  });

  // Mutation para atualizar cupom
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      couponsService.update(id, data),
    onSuccess: () => {
      toast.success('Cupom atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      closeForm();
    },
    onError: () => {
      toast.error('Erro ao atualizar cupom');
    },
  });

  // Mutation para remover cupom
  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsService.remove(id),
    onSuccess: () => {
      toast.success('Cupom removido!');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: () => {
      toast.error('Erro ao remover cupom');
    },
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minimumOrderValue: '',
      maximumDiscount: '',
      validFrom: '',
      validUntil: '',
      usageLimit: '',
      isActive: true,
    });
  };

  const openEditForm = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minimumOrderValue: coupon.minimumOrderValue ? String(coupon.minimumOrderValue) : '',
      maximumDiscount: coupon.maximumDiscount ? String(coupon.maximumDiscount) : '',
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      isActive: coupon.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: formData.code.toUpperCase(),
      description: formData.description || undefined,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minimumOrderValue: formData.minimumOrderValue ? Number(formData.minimumOrderValue) : undefined,
      maximumDiscount: formData.maximumDiscount ? Number(formData.maximumDiscount) : undefined,
      validFrom: formData.validFrom || undefined,
      validUntil: formData.validUntil || undefined,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
      isActive: formData.isActive,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cupons</h1>
          <p className="text-muted-foreground">Gerencie os cupons de desconto</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Formulário de cupom */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Código do cupom */}
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  required
                  placeholder="DESCONTO10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              {/* Tipo de desconto */}
              <div className="space-y-2">
                <Label>Tipo de Desconto *</Label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>

              {/* Valor do desconto */}
              <div className="space-y-2">
                <Label>
                  Valor do Desconto *
                  {formData.discountType === 'percentage' ? ' (%)' : ' (R$)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                />
              </div>

              {/* Valor mínimo do pedido */}
              <div className="space-y-2">
                <Label>Valor Mínimo do Pedido (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimumOrderValue}
                  onChange={(e) => setFormData({ ...formData, minimumOrderValue: e.target.value })}
                />
              </div>

              {/* Desconto máximo (para cupons percentuais) */}
              {formData.discountType === 'percentage' && (
                <div className="space-y-2">
                  <Label>Desconto Máximo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                  />
                </div>
              )}

              {/* Limite de uso */}
              <div className="space-y-2">
                <Label>Limite de Uso (deixe vazio para ilimitado)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                />
              </div>

              {/* Data de início */}
              <div className="space-y-2">
                <Label>Válido a partir de</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              {/* Data de expiração */}
              <div className="space-y-2">
                <Label>Válido até</Label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição interna</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Status ativo */}
              <div className="space-y-2">
                <Label>Status</Label>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm">Cupom ativo</span>
                </label>
              </div>

              {/* Botões */}
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Salvando...'
                    : editingCoupon
                    ? 'Atualizar'
                    : 'Criar Cupom'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabela de cupons */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : coupons.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Desconto</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Usos</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Validade</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <p className="font-mono font-bold">{coupon.code}</p>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground">{coupon.description}</p>
                        )}
                      </td>
                      <td className="p-3">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : formatCurrency(Number(coupon.discountValue))}
                      </td>
                      <td className="p-3 text-right">
                        {coupon.usageCount}
                        {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {coupon.validUntil ? `Até ${formatDate(coupon.validUntil)}` : 'Sem limite'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {coupon.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditForm(coupon)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              if (window.confirm(`Remover o cupom "${coupon.code}"?`)) {
                                deleteMutation.mutate(coupon.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum cupom cadastrado ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
