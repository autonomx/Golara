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
  successUrl?: string;
  cancelUrl?: string;
  idempotencyKey?: string;
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

type GatewayJsonHttpResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type GatewayJsonHttpClient = (
  url: string,
  init: {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
  }
) => Promise<GatewayJsonHttpResponse>;

export type StripeCheckoutSessionHttpResponse = GatewayJsonHttpResponse;
export type StripeCheckoutSessionHttpClient = GatewayJsonHttpClient;

export type StripeCheckoutSessionAdapterOptions = {
  secretKey?: string;
  httpClient?: StripeCheckoutSessionHttpClient;
  apiUrl?: string;
};

export type ZarinPalPaymentRequestHttpResponse = GatewayJsonHttpResponse;
export type ZarinPalPaymentRequestHttpClient = GatewayJsonHttpClient;

export type ZarinPalPaymentRequestAdapterOptions = {
  merchantId?: string;
  httpClient?: ZarinPalPaymentRequestHttpClient;
  requestUrl?: string;
  startPayUrl?: string;
  description?: string;
};

type StripeCheckoutSessionResponseBody = {
  id?: unknown;
  url?: unknown;
  error?: { message?: unknown };
};

type ZarinPalPaymentRequestResponseBody = {
  data?: {
    authority?: unknown;
    code?: unknown;
    message?: unknown;
  };
  errors?: { message?: unknown } | string[] | Record<string, unknown>;
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

function defaultCheckoutReturnUrl(input: PaymentGatewayInitiationInput, outcome: 'success' | 'cancel') {
  const separator = input.returnUrl.includes('?') ? '&' : '?';
  return `${input.returnUrl}${separator}payment=${outcome}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`;
}

function defaultZarinPalCallbackUrl(input: PaymentGatewayInitiationInput) {
  const separator = input.returnUrl.includes('?') ? '&' : '?';
  return `${input.returnUrl}${separator}provider=zarinpal&order=${encodeURIComponent(input.orderId)}`;
}

function tomanAmount(input: PaymentGatewayInitiationInput) {
  return Math.round(input.amountCents);
}

function appendStripeMetadata(body: URLSearchParams, input: PaymentGatewayInitiationInput) {
  body.set('metadata[golara_order_id]', input.orderId);
  if (input.orderNumber) body.set('metadata[golara_order_number]', input.orderNumber);
  for (const [key, value] of Object.entries(input.metadata ?? {})) body.set(`metadata[${key}]`, value);
}

function defaultJsonHttpClient(): GatewayJsonHttpClient {
  return async (url, init) => {
    if (typeof fetch !== 'function') throw new Error('Payment gateway request requires fetch support.');
    return fetch(url, init);
  };
}

function defaultStripeHttpClient(): StripeCheckoutSessionHttpClient {
  return defaultJsonHttpClient();
}

function defaultZarinPalHttpClient(): ZarinPalPaymentRequestHttpClient {
  return defaultJsonHttpClient();
}

async function parseStripeResponse(response: StripeCheckoutSessionHttpResponse) {
  return (await response.json()) as StripeCheckoutSessionResponseBody;
}

async function parseZarinPalResponse(response: ZarinPalPaymentRequestHttpResponse) {
  return (await response.json()) as ZarinPalPaymentRequestResponseBody;
}

function zarinPalErrorMessage(body: ZarinPalPaymentRequestResponseBody, status: number) {
  if (typeof body.errors === 'object' && body.errors && !Array.isArray(body.errors) && typeof body.errors.message === 'string') return body.errors.message;
  if (Array.isArray(body.errors) && body.errors.length) return body.errors.join(', ');
  if (typeof body.data?.message === 'string') return body.data.message;
  return `ZarinPal returned HTTP ${status}.`;
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
        return { provider: 'iranian', status: 'unavailable', reference: reference('iranian', input), message: 'Iranian gateway mock only supports Toman orders.' };
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

export function createZarinPalGatewayMockAdapter(): PaymentGatewayAdapter {
  return {
    provider: 'zarinpal',
    async initiate(input) {
      ensurePositiveAmount(input);
      if (input.currency !== 'TOMAN') {
        return { provider: 'zarinpal', status: 'unavailable', reference: reference('zarinpal', input), message: 'ZarinPal mock only supports Toman orders.' };
      }
      return {
        provider: 'zarinpal',
        status: 'redirect',
        reference: reference('zarinpal', input),
        redirectUrl: `/checkout/mock/zarinpal?order=${encodeURIComponent(input.orderId)}&return=${encodedReturnUrl(input)}`,
        message: 'ZarinPal mock redirect prepared.'
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
        return { provider: 'stripe', status: 'unavailable', reference: reference('stripe', input), message: 'Stripe mock does not support Toman orders.' };
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

export function createStripeCheckoutSessionAdapter(options: StripeCheckoutSessionAdapterOptions = {}): PaymentGatewayAdapter {
  return {
    provider: 'stripe',
    async initiate(input) {
      ensurePositiveAmount(input);
      if (input.currency === 'TOMAN') {
        return { provider: 'stripe', status: 'unavailable', reference: reference('stripe', input), message: 'Stripe checkout sessions do not support Toman orders.' };
      }

      const secretKey = options.secretKey?.trim();
      if (!secretKey) {
        return { provider: 'stripe', status: 'unavailable', reference: reference('stripe', input), message: 'Stripe checkout requires STRIPE_SECRET_KEY.' };
      }

      const body = new URLSearchParams();
      body.set('mode', 'payment');
      body.set('success_url', input.successUrl ?? defaultCheckoutReturnUrl(input, 'success'));
      body.set('cancel_url', input.cancelUrl ?? defaultCheckoutReturnUrl(input, 'cancel'));
      body.set('client_reference_id', input.orderId);
      body.set('line_items[0][quantity]', '1');
      body.set('line_items[0][price_data][currency]', input.currency.toLowerCase());
      body.set('line_items[0][price_data][unit_amount]', String(Math.round(input.amountCents)));
      body.set('line_items[0][price_data][product_data][name]', `Golara order ${input.orderNumber ?? input.orderId}`);
      if (input.customerEmail) body.set('customer_email', input.customerEmail);
      appendStripeMetadata(body, input);

      const response = await (options.httpClient ?? defaultStripeHttpClient())(options.apiUrl ?? 'https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': input.idempotencyKey ?? `golara_checkout_${input.orderId}`
        },
        body: body.toString()
      });
      const responseBody = await parseStripeResponse(response);

      if (!response.ok || typeof responseBody.id !== 'string') {
        const detail = typeof responseBody.error?.message === 'string' ? responseBody.error.message : `Stripe returned HTTP ${response.status}.`;
        return { provider: 'stripe', status: 'unavailable', reference: reference('stripe', input), message: `Stripe checkout session could not be created: ${detail}` };
      }

      return {
        provider: 'stripe',
        status: 'redirect',
        reference: responseBody.id,
        redirectUrl: typeof responseBody.url === 'string' ? responseBody.url : undefined,
        message: 'Stripe checkout session created.'
      };
    }
  };
}

export function createZarinPalPaymentRequestAdapter(options: ZarinPalPaymentRequestAdapterOptions = {}): PaymentGatewayAdapter {
  return {
    provider: 'zarinpal',
    async initiate(input) {
      ensurePositiveAmount(input);
      if (input.currency !== 'TOMAN') {
        return { provider: 'zarinpal', status: 'unavailable', reference: reference('zarinpal', input), message: 'ZarinPal checkout only supports Toman orders.' };
      }

      const merchantId = options.merchantId?.trim();
      if (!merchantId) {
        return { provider: 'zarinpal', status: 'unavailable', reference: reference('zarinpal', input), message: 'ZarinPal checkout requires ZARINPAL_MERCHANT_ID.' };
      }

      const response = await (options.httpClient ?? defaultZarinPalHttpClient())(options.requestUrl ?? 'https://api.zarinpal.com/pg/v4/payment/request.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': input.idempotencyKey ?? `golara_zarinpal_${input.orderId}`
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: tomanAmount(input),
          callback_url: input.successUrl ?? defaultZarinPalCallbackUrl(input),
          description: options.description ?? `Golara order ${input.orderNumber ?? input.orderId}`,
          metadata: {
            email: input.customerEmail,
            mobile: input.customerPhone,
            order_id: input.orderId,
            order_number: input.orderNumber,
            ...input.metadata
          }
        })
      });
      const responseBody = await parseZarinPalResponse(response);
      const authority = responseBody.data?.authority;
      const code = responseBody.data?.code;

      if (!response.ok || typeof authority !== 'string' || code !== 100) {
        return { provider: 'zarinpal', status: 'unavailable', reference: reference('zarinpal', input), message: `ZarinPal payment request could not be created: ${zarinPalErrorMessage(responseBody, response.status)}` };
      }

      return {
        provider: 'zarinpal',
        status: 'redirect',
        reference: authority,
        redirectUrl: `${options.startPayUrl ?? 'https://www.zarinpal.com/pg/StartPay'}/${encodeURIComponent(authority)}`,
        message: 'ZarinPal payment request created.'
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
      return { provider: 'inquiry', status: 'manual', reference: reference('inquiry', input), message: 'Inquiry fallback selected; staff will follow up before payment.' };
    }
  };
}

export function createMockPaymentGatewayAdapters(): Record<PaymentGatewayAdapterProvider, PaymentGatewayAdapter> {
  return {
    manual: createManualGatewayAdapter(),
    iranian: createIranianGatewayMockAdapter(),
    zarinpal: createZarinPalGatewayMockAdapter(),
    stripe: createStripeGatewayMockAdapter(),
    whatsapp: createWhatsAppGatewayAdapter(),
    inquiry: createInquiryGatewayAdapter()
  };
}

export function createLivePaymentGatewayAdapters(options: {
  stripeSecretKey?: string;
  stripeHttpClient?: StripeCheckoutSessionHttpClient;
  zarinpalMerchantId?: string;
  zarinpalHttpClient?: ZarinPalPaymentRequestHttpClient;
  zarinpalRequestUrl?: string;
  zarinpalStartPayUrl?: string;
  zarinpalDescription?: string;
} = {}): Record<PaymentGatewayAdapterProvider, PaymentGatewayAdapter> {
  return {
    manual: createManualGatewayAdapter(),
    iranian: createIranianGatewayMockAdapter(),
    zarinpal: createZarinPalPaymentRequestAdapter({
      merchantId: options.zarinpalMerchantId,
      httpClient: options.zarinpalHttpClient,
      requestUrl: options.zarinpalRequestUrl,
      startPayUrl: options.zarinpalStartPayUrl,
      description: options.zarinpalDescription
    }),
    stripe: createStripeCheckoutSessionAdapter({ secretKey: options.stripeSecretKey, httpClient: options.stripeHttpClient }),
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
