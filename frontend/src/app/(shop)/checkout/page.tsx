// Página de checkout — formulário de endereço, resumo do pedido e pagamento real via Stripe

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag, ArrowLeft } from 'lucide-react';
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
import { StripePaymentForm } from '@/components/checkout/stripe-payment-form';

// Schema de validação do formulário de checkout — dados de cartão não fazem mais
// parte deste formulário, são coletados diretamente pelo Stripe Elements
const checkoutSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  address: z.string().min(5, 'Endereço é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP inválido'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  paymentMethod: z.enum(['credit_card', 'pix', 'boleto']),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Etapa "payment" só existe para pagamentos com cartão, quando aguardamos a
// confirmação do PaymentIntent via Stripe Elements
interface PendingCardPayment {
  clientSecret: string;
  orderNumber: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, hasFetched: cartFetched } = useCartStore();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [pendingCardPayment, setPendingCardPayment] = useState<PendingCardPayment | null>(null);

  const {
    register,
    handleSubmit,
    control,
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
      paymentMethod: 'credit_card',
    },
  });

  const selectedPaymentMethod = useWatch({
    control,
    name: "paymentMethod",
  });

  useEffect(() => {
    // Aguarda a hidratação do estado de autenticação antes de qualquer decisão,
    // para não redirecionar um usuário válido logo após um refresh de página
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
    } else if (!pendingCardPayment && cartFetched && (!cart || cart.items.length === 0)) {
      // Só redireciona por carrinho vazio depois que o carrinho foi realmente
      // buscado. Não redireciona enquanto o pagamento com cartão está pendente —
      // o carrinho já foi esvaziado no backend assim que o pedido foi criado
      router.push('/products');
    }
  }, [hasHydrated, isAuthenticated, cart, cartFetched, pendingCardPayment, router]);

  // Enquanto o estado ainda não hidratou/carregou, não decide nada (evita flash)
  if (!hasHydrated || !isAuthenticated) {
    return null;
  }
  if (!pendingCardPayment && cartFetched && (!cart || cart.items.length === 0)) {
    return null;
  }

  const subtotal = cart?.subtotal ?? 0;
  const shippingCost = subtotal > 200 ? 0 : 19.9;
  const total = subtotal - discountAmount + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const response = await couponsService.validate(couponCode, subtotal);
      const coupon = response.data.data;
      setAppliedCoupon(coupon);
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * Number(coupon.discountValue)) / 100;
        if (coupon.maximumDiscount) discount = Math.min(discount, Number(coupon.maximumDiscount));
      } else {
        discount = Math.min(Number(coupon.discountValue), subtotal);
      }
      setDiscountAmount(Math.round(discount * 100) / 100);
      toast.success(`Cupom "${coupon.code}" aplicado!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cupom inválido');
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
  };

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

      const { order, clientSecret } = response.data.data;

      // O backend já esvaziou o carrinho na mesma transação que criou o pedido —
      // sincroniza o estado local para refletir isso
      await clearCart();

      if (data.paymentMethod === 'credit_card' && clientSecret) {
        // Cartão: aguarda a confirmação do pagamento via Stripe Elements antes
        // de considerar o checkout concluído
        setPendingCardPayment({ clientSecret, orderNumber: order.orderNumber });
        return;
      }

      // PIX/boleto seguem o fluxo simulado já existente
      router.push(`/checkout/success?orderNumber=${order.orderNumber}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao finalizar o pedido');
    }
  };

  // Etapa de confirmação do pagamento com cartão
  if (pendingCardPayment) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <button
          onClick={() => setPendingCardPayment(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <Card>
          <CardHeader>
            <CardTitle>Pagamento com Cartão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex justify-between text-sm border-b pb-4">
              <span className="text-muted-foreground">Pedido {pendingCardPayment.orderNumber}</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
            <StripePaymentForm
              clientSecret={pendingCardPayment.clientSecret}
              submitLabel={`Pagar ${formatCurrency(total)}`}
              onSuccess={() =>
                router.push(`/checkout/success?orderNumber=${pendingCardPayment.orderNumber}`)
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" placeholder="Rua, número, complemento" {...register('address')} />
                  {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" {...register('city')} />
                    {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" placeholder="SP" maxLength={2} {...register('state')} />
                    {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input id="zipCode" placeholder="00000-000" {...register('zipCode')} />
                    {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'credit_card', label: 'Cartão de Crédito', description: 'Via Stripe' },
                    { value: 'pix', label: 'PIX', description: '5% desconto' },
                    { value: 'boleto', label: 'Boleto', description: 'Vence em 3 dias' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${selectedPaymentMethod === option.value ? 'bg-accent/50 border-primary' : ''}`}
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

                {selectedPaymentMethod === 'credit_card' && (
                  <p className="text-xs text-muted-foreground pt-1 text-center">
                    Você informará os dados do cartão na próxima etapa, em um ambiente seguro fornecido pela Stripe.
                  </p>
                )}
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full hidden lg:flex" disabled={isSubmitting}>
              {isSubmitting
                ? 'Processando...'
                : selectedPaymentMethod === 'credit_card'
                  ? 'Continuar para Pagamento'
                  : `Finalizar Pedido — ${formatCurrency(total)}`}
            </Button>
          </form>
        </div>

        {/*  RESUMO DO PEDIDO  */}
        <div className="space-y-4">
          {/* Lista de itens do pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Itens do carrinho */}
              {cart?.items.map((item) => (
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
                    aria-label="Remover cupom aplicado"
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
            {isSubmitting
              ? 'Processando...'
              : selectedPaymentMethod === 'credit_card'
                ? 'Continuar para Pagamento'
                : `Finalizar — ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
