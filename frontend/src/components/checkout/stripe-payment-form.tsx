// Formulário de pagamento com cartão usando Stripe Elements — confirma o
// PaymentIntent já criado pelo backend (client_secret) diretamente no navegador,
// sem que dados de cartão jamais passem pelo nosso servidor

'use client';

import { useState, FormEvent } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStripe } from '@/lib/stripe';
import { toast } from 'sonner';

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  submitLabel: string;
}

function PaymentForm({ onSuccess, submitLabel }: Omit<StripePaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    // redirect: 'if_required' evita redirecionar a página inteira quando o
    // cartão de teste não exige autenticação 3D Secure
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Não foi possível processar o pagamento.');
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      onSuccess();
      return;
    }

    toast.error('O pagamento não foi concluído. Tente novamente.');
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || isProcessing}>
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando pagamento...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            {submitLabel}
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Pagamento processado com segurança pela Stripe. Seus dados de cartão nunca passam pelo nosso servidor.
      </p>
    </form>
  );
}

export function StripePaymentForm({ clientSecret, onSuccess, submitLabel }: StripePaymentFormProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        locale: 'pt-BR',
        appearance: { theme: 'stripe' },
      }}
    >
      <PaymentForm onSuccess={onSuccess} submitLabel={submitLabel} />
    </Elements>
  );
}
