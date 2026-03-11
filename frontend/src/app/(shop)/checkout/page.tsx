// checkout/page.tsx
// Página de checkout — formulário de endereço, resumo do pedido e pagamento mock

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Tag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { ordersService, couponsService } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import { Coupon } from '@/types';
import { toast } from 'sonner';

// Schema de validação do formulário de checkout
const checkoutSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  address: z.string().min(5, 'Endereço é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP inválido'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'boleto']),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  // Estados locais para cupom de desconto
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Preenche o formulário com os dados do usuário logado como padrão
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
      phone: user?.phone || '',
      paymentMethod: 'pix',
    },
  });

  // Redireciona para login ou loja usando useEffect para evitar erros de SSR
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!cart || cart.items.length === 0) {
      router.push('/products');
    }
  }, [isAuthenticated, cart, router]);

  // Mostra nada enquanto verifica/redireciona
  if (!isAuthenticated || !cart || cart.items.length === 0) {
    return null;
  }

  // Calcula os valores do pedido
  const subtotal = cart.subtotal;
  const shippingCost = subtotal > 200 ? 0 : 19.9; // Frete grátis acima de R$ 200
  const total = subtotal - discountAmount + shippingCost;

  // Aplica o cupom de desconto ao subtotal
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const response = await couponsService.validate(couponCode, subtotal);
      const coupon = response.data.data;
      setAppliedCoupon(coupon);

      // Calcula o desconto baseado no tipo do cupom
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * Number(coupon.discountValue)) / 100;
        if (coupon.maximumDiscount) {
          discount = Math.min(discount, Number(coupon.maximumDiscount));
        }
      } else {
        discount = Math.min(Number(coupon.discountValue), subtotal);
      }

      setDiscountAmount(Math.round(discount * 100) / 100);
      toast.success(`Cupom "${coupon.code}" aplicado com sucesso!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cupom inválido');
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Remove o cupom aplicado
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
  };

  // Finaliza o pedido
  const onSubmit = async (data: CheckoutFormData) => {
    try {
      const response = await ordersService.create({
        paymentMethod: data.paymentMethod,
        shippingAddress: {
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          phone: data.phone,
        },
        couponCode: appliedCoupon?.code,
      });

      const order = response.data.data;

      // Limpa o carrinho após o pedido bem-sucedido
      await clearCart();

      // Redireciona para a página de sucesso com o número do pedido
      router.push(`/checkout/success?orderNumber=${order.orderNumber}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao finalizar o pedido');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ==================== FORMULÁRIO DE CHECKOUT ==================== */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção de endereço de entrega */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nome do destinatário */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Endereço */}
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" placeholder="Rua, número, complemento" {...register('address')} />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>

                {/* Cidade e Estado na mesma linha */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" {...register('city')} />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" placeholder="SP" maxLength={2} {...register('state')} />
                    {errors.state && (
                      <p className="text-sm text-destructive">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                {/* CEP e Telefone na mesma linha */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input id="zipCode" placeholder="00000-000" {...register('zipCode')} />
                    {errors.zipCode && (
                      <p className="text-sm text-destructive">{errors.zipCode.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seção de método de pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Opções de pagamento como radio buttons estilizados */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'pix', label: 'PIX', description: '5% desconto' },
                    { value: 'credit_card', label: 'Cartão de Crédito', description: 'Até 12x' },
                    { value: 'debit_card', label: 'Cartão de Débito', description: 'À vista' },
                    { value: 'boleto', label: 'Boleto', description: 'Vence em 3 dias' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                    >
                      <input
                        type="radio"
                        value={option.value}
                        {...register('paymentMethod')}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Botão de finalizar — apenas visível em telas grandes */}
            <Button type="submit" size="lg" className="w-full hidden lg:flex" disabled={isSubmitting}>
              {isSubmitting ? 'Processando...' : `Finalizar Pedido — ${formatCurrency(total)}`}
            </Button>
          </form>
        </div>

        {/* ==================== RESUMO DO PEDIDO ==================== */}
        <div className="space-y-4">
          {/* Lista de itens do pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Itens do carrinho */}
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="flex-1 truncate mr-2">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(Number(item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}

              <div className="border-t pt-3 space-y-2">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {/* Desconto do cupom */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto ({appliedCoupon?.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {/* Frete */}
                <div className="flex justify-between text-sm">
                  <span>Frete</span>
                  <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                    {shippingCost === 0 ? 'Grátis' : formatCurrency(shippingCost)}
                  </span>
                </div>

                {/* Total */}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de cupom de desconto */}
          <Card>
            <CardContent className="pt-6">
              {appliedCoupon ? (
                // Exibe o cupom aplicado com opção de remover
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {appliedCoupon.code}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                // Campo para digitar o código do cupom
                <div className="space-y-2">
                  <Label>Cupom de Desconto</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="SEUCUPOM"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão de finalizar em mobile */}
          <Button
            size="lg"
            className="w-full lg:hidden"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : `Finalizar — ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
