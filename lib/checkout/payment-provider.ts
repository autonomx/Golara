import 'server-only';

import { mapCheckoutAttemptStatus } from '@/lib/checkout/checkout-attempt-status';
import { createLivePaymentGatewayAdapters, initiatePaymentGateway } from '@/lib/checkout/payment-gateway-adapters';
import { normalizeCheckoutProviderName, type CheckoutPaymentProviderName, type LegacyPaymentProviderName } from '@/lib/checkout/payment-provider-alias-core';
import { createCheckoutProviderRuntimeAttempt } from '@/lib/checkout/payment-provider-runtime-core';
import { hasDatabase, prisma } from '@/lib/prisma';

export type PaymentProviderName = CheckoutPaymentProviderName;

type CreatePaymentAttemptInput = {
  orderId: string;
  provider?: PaymentProviderName;
  metadata?: PaymentMetadata;
};

type PaymentMetadata = Record<string, string | number | boolean | string[]>;

type PaymentProviderResult = {
  provider: PaymentProviderName;
  status: 'manual_pending' | 'created' | 'redirect_required';
  providerReference?: string;
  redirectUrl?: string;
  metadata?: PaymentMetadata;
};

type PaymentProviderOrder = {
  id: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
  status: string;
  publicLookupToken?: string | null;
};

type LocalPaymentProvider = {
  name: LegacyPaymentProviderName;
  createAttempt(order: PaymentProviderOrder): Promise<PaymentProviderResult>;
};

function configuredPaymentProvider(): PaymentProviderName {
  const provider = process.env.CHECKOUT_DOMESTIC_GATEWAY_PROVIDER?.trim().toLowerCase() || 'manual';
  return normalizeCheckoutProviderName(provider);
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || '';
}

function checkoutReturnUrl(order: PaymentProviderOrder, provider?: PaymentProviderName) {
  if (!order.publicLookupToken || !siteUrl()) return undefined;
  const returnUrl = new URL(`${siteUrl()}/orders/return`);
  returnUrl.searchParams.set('order', order.orderNumber);
  returnUrl.searchParams.set('token', order.publicLookupToken);
  if (provider) returnUrl.searchParams.set('provider', provider);
  return returnUrl.toString();
}

function liveGatewayAdapters() {
  return createLivePaymentGatewayAdapters({
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    zarinpalMerchantId: process.env.ZARINPAL_MERCHANT_ID,
    zarinpalRequestUrl: process.env.ZARINPAL_REQUEST_URL,
    zarinpalStartPayUrl: process.env.ZARINPAL_START_URL,
    zarinpalDescription: process.env.ZARINPAL_DESCRIPTION
  });
}

function methodAwareProviderReferenceMetadata(result: PaymentProviderResult, metadata: PaymentMetadata): PaymentMetadata {
  const methodKey = typeof metadata.paymentMethodKey === 'string' ? metadata.paymentMethodKey : undefined;
  if (!result.providerReference || !methodKey) return {};

  return {
    paymentProviderReference: result.providerReference,
    paymentProviderReferenceMethodKey: methodKey,
    paymentProviderReferenceProvider: result.provider,
    paymentProviderReferenceStatus: result.status,
    paymentProviderReferenceCaptured: true
  };
}

const manualPaymentProvider: LocalPaymentProvider = {
  name: 'manual',
  async createAttempt(order) {
    return {
      provider: 'manual',
      status: mapCheckoutAttemptStatus('manual'),
      providerReference: order.orderNumber,
      metadata: {
        instruction: 'Manual staff follow-up required',
        orderNumber: order.orderNumber
      }
    };
  }
};

const domesticRedirectProvider: LocalPaymentProvider = {
  name: 'domestic_redirect',
  async createAttempt(order) {
    const baseUrl = process.env.CHECKOUT_DOMESTIC_GATEWAY_START_URL?.trim();
    if (!baseUrl) {
      const metadata: PaymentMetadata = {
        instruction: 'Domestic redirect URL is not configured; manual staff follow-up required',
        orderNumber: order.orderNumber
      };
      return {
        provider: 'domestic_redirect',
        status: mapCheckoutAttemptStatus('manual'),
        providerReference: order.orderNumber,
        metadata
      };
    }

    const url = new URL(baseUrl);
    url.searchParams.set('order', order.orderNumber);
    url.searchParams.set('amount', String(order.totalCents));
    url.searchParams.set('currency', order.currency);
    const returnUrl = checkoutReturnUrl(order, 'domestic_redirect');
    if (returnUrl) url.searchParams.set('callback', returnUrl);

    return {
      provider: 'domestic_redirect',
      status: mapCheckoutAttemptStatus('redirect'),
      providerReference: order.orderNumber,
      redirectUrl: url.toString(),
      metadata: {
        orderNumber: order.orderNumber,
        configuredUrl: baseUrl
      }
    };
  }
};

function getLocalPaymentProvider(provider?: LegacyPaymentProviderName): LocalPaymentProvider {
  if (provider === 'domestic_redirect') return domesticRedirectProvider;
  return manualPaymentProvider;
}

export async function createCheckoutPaymentAttempt(input: CreatePaymentAttemptInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout payment attempts.');

  const order = await prisma.checkoutOrder.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      orderNumber: true,
      totalCents: true,
      currency: true,
      status: true,
      publicLookupToken: true
    }
  });

  if (!order) throw new Error('Order draft not found.');
  if (order.totalCents <= 0) throw new Error('Order total must be greater than zero before payment.');
  if (!['draft', 'pending_payment'].includes(order.status)) {
    throw new Error('Order is not eligible for payment.');
  }

  const provider = input.provider ?? configuredPaymentProvider();
  const result = await createCheckoutProviderRuntimeAttempt({
    order,
    provider,
    returnUrl: checkoutReturnUrl(order, provider) ?? siteUrl(),
    localAttempt: async (localProvider, localOrder) => getLocalPaymentProvider(localProvider).createAttempt(localOrder),
    adapterAttempt: async (adapterProvider, payment) => initiatePaymentGateway({
      provider: adapterProvider,
      payment,
      adapters: liveGatewayAdapters()
    })
  });
  const mergedMetadata = { ...(input.metadata ?? {}), ...(result.metadata ?? {}) };
  const finalMetadata = { ...mergedMetadata, ...methodAwareProviderReferenceMetadata(result, mergedMetadata) };

  const attemptData = {
    orderId: order.id,
    provider: result.provider,
    status: result.status,
    amountCents: order.totalCents,
    currency: order.currency,
    ...(result.providerReference ? { providerReference: result.providerReference } : {}),
    ...(result.redirectUrl ? { redirectUrl: result.redirectUrl } : {}),
    ...(Object.keys(finalMetadata).length ? { metadata: finalMetadata } : {})
  };

  const attempt = await prisma.checkoutPaymentAttempt.create({
    data: attemptData
  });

  await prisma.checkoutOrder.update({
    where: { id: order.id },
    data: { status: 'pending_payment' }
  });

  return attempt;
}
