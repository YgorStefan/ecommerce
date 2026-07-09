// Instância singleton do Stripe.js — loadStripe() não deve ser chamado a cada
// renderização, apenas uma vez por sessão de página

import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      // eslint-disable-next-line no-console
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não configurada.');
    }
    stripePromise = loadStripe(publishableKey || '');
  }
  return stripePromise;
}
