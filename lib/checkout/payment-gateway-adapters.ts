import type { CheckoutCurrency, PaymentGatewayProvider, OverseasFallback } from '@/lib/checkout/payment-gateway-config';

export type PaymentGatewayAdapterProvider = PaymentGatewayProvider | Extract<OverseasFallback, 'whatsapp' | 'inquiry'>;

export type PaymentGatewayInitiationInput = {
  orderId: string;
  orderNumber?: string;
  amountCents: number;
  currency: CheckoutCurrency;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl: string;
  metadata?: Record<string, string>;
};

export type PaymentGatewayInitiationStatus = 'started' | 'manual' | 'redirect' | 'unavailable';

export type PaymentGatewayInitiationResult = {
  provider: PaymentGatewayAdapterProvider;
  status: PaymentGatewayInitiationStatus;
  reference: string;
  redirectUrl?: string;
  message: string;
};

export type PaymentGatewayAdapter = {
  provider: PaymentGatewayAdapterProvider;
  initiate(input: PaymentGatewayInitiationInput): Promise<PaymentGatewayInitiationResult>;
};

function ensurePositiveAmount(input: PaymentGatewayInitiationInput) {
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Payment gateway initiation requires a positive amount.');
  }
}

function reference(provider: PaymentGatewayAdapterProvider, input: PaymentGatewayInitiationInput) {
  return `${provider}:${input.orderNumber ?? input.orderId}`;
}

function encodedReturnUrl(input: PaymentGatewayInitiationInput) {
  return encodeURIComponent(input.returnUrl);
}

export function createManualGatewayAdapter(): PaymentGatewayAdapter {
  return {
    provider: 'manual',
    async initiate(input) {
      ensurePositiveAmount(input);
      return {
        provider: 'manual',
        status: 'manual',
        reference: reference('manual', input),
        message: 'Manual checkout selected; staff will confirm payment and fulfillment details.'
      };
    }
  };
}

export function createIranianGatewayMockAdapter(): PaymentGatewayAdapter {
  return {
    provider: 'iranian',
    async initiate(input) {
      ensurePositiveAmount(input);
      if (input.currency !== 'TOMAN') {
        return {
          provider: 'iranian',
          status: 'unavailable',
          reference: reference('iranian', input),
          message: 'Iranian gateway mock only supports Toman orders.'
        };
      }
      return {
        provider: 'iranian',
        status: 'redirect',
        reference: reference('iranian', input),
        redirectUrl: `/checkout/mock/iranian?order=${encodeURIComponent(input.orderId)}&return=${encodedReturnUrl(input)}`,
        message: 'Iranian gateway mock redirect prepared.'
      };
    }
  };
}

export function createStripeGatewayMockAdapter(): PaymentGatewayAdapter {
  return {
    provider: 'stripe',
    async initiate(input) {
      ensurePositiveAmount(input);
      if (input.currency === 'TOMAN') {
        return {
          provider: 'stripe',
          status: 'unavailable',
          reference: reference('stripe', input),
          message: 'Stripe mock does not support Toman orders.'
        };
      }
      return {
        provider: 'stripe',
        status: 'redirect',
        reference: reference('stripe', input),
        redirectUrl: `/checkout/mock/stripe?order=${encodeURIComponent(input.orderId)}&return=${encodedReturnUrl(input)}`,
        message: 'Stripe mock redirect prepared.'
      };
    }
  };
}

export function createWhatsAppGatewayAdapter(): PaymentGatewayAdapter {
  return {
    provider: 'whatsapp',
    async initiate(input) {
      ensurePositiveAmount(input);
      return {
        provider: 'whatsapp',
        status: 'manual',
        reference: reference('whatsapp', input),
        redirectUrl: `https://wa.me/?text=${encodeURIComponent(`Order ${input.orderNumber ?? input.orderId}`)}`,
        message: 'WhatsApp assisted checkout selected.'
      };
    }
  };
}

export function createInquiryGatewayAdapter(): PaymentGatewayAdapter {
  return {
    provider: 'inquiry',
    async initiate(input) {
      ensurePositiveAmount(input);
      return {
        provider: 'inquiry',
        status: 'manual',
        reference: reference('inquiry', input),
        message: 'Inquiry fallback selected; staff will follow up before payment.'
      };
    }
  };
}

export function createMockPaymentGatewayAdapters(): Record<PaymentGatewayAdapterProvider, PaymentGatewayAdapter> {
  return {
    manual: createManualGatewayAdapter(),
    iranian: createIranianGatewayMockAdapter(),
    stripe: createStripeGatewayMockAdapter(),
    whatsapp: createWhatsAppGatewayAdapter(),
    inquiry: createInquiryGatewayAdapter()
  };
}

export async function initiatePaymentGateway(input: {
  provider: PaymentGatewayAdapterProvider;
  adapters?: Record<PaymentGatewayAdapterProvider, PaymentGatewayAdapter>;
  payment: PaymentGatewayInitiationInput;
}) {
  const adapters = input.adapters ?? createMockPaymentGatewayAdapters();
  return adapters[input.provider].initiate(input.payment);
}
