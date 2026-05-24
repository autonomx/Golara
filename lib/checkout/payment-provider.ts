import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export type PaymentProviderName = 'manual' | 'domestic_redirect';

type CreatePaymentAttemptInput = {
  orderId: string;
  provider?: PaymentProviderName;
};

type PaymentProviderResult = {
  provider: PaymentProviderName;
  status: 'manual_pending' | 'created' | 'redirect_required';
  providerReference?: string;
  redirectUrl?: string;
  metadata?: Record<string, string | number | boolean>;
};

type PaymentProvider = {
  name: PaymentProviderName;
  createAttempt(order: { id: string; orderNumber: string; totalCents: number; currency: string; publicLookupToken?: string | null }): Promise<PaymentProviderResult>;
};

function configuredPaymentProvider(): PaymentProviderName {
  const provider = process.env.CHECKOUT_DOMESTIC_GATEWAY_PROVIDER?.trim().toLowerCase() || 'manual';
  if (provider === 'manual') return 'manual';
  if (provider === 'domestic_redirect') return 'domestic_redirect';
  console.warn('[checkout] unsupported CHECKOUT_DOMESTIC_GATEWAY_PROVIDER; using manual', { provider });
  return 'manual';
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || '';
}

const manualPaymentProvider: PaymentProvider = {
  name: 'manual',
  async createAttempt(order) {
    return {
      provider: 'manual',
      status: 'manual_pending',
      providerReference: order.orderNumber,
      metadata: {
        instruction: 'Manual staff follow-up required',
        orderNumber: order.orderNumber
      }
    };
  }
};

const domesticRedirectProvider: PaymentProvider = {
  name: 'domestic_redirect',
  async createAttempt(order) {
    const baseUrl = process.env.CHECKOUT_DOMESTIC_GATEWAY_START_URL?.trim();
    if (!baseUrl) {
      return {
        provider: 'domestic_redirect',
        status: 'manual_pending',
        providerReference: order.orderNumber,
        metadata: {
          instruction: 'Domestic redirect URL is not configured; manual staff follow-up required',
          orderNumber: order.orderNumber
        }
      };
    }

    const url = new URL(baseUrl);
    url.searchParams.set('order', order.orderNumber);
    url.searchParams.set('amount', String(order.totalCents));
    url.searchParams.set('currency', order.currency);
    if (order.publicLookupToken && siteUrl()) {
      url.searchParams.set('callback', `${siteUrl()}/orders/${order.publicLookupToken}`);
    }

    return {
      provider: 'domestic_redirect',
      status: 'redirect_required',
      providerReference: order.orderNumber,
      redirectUrl: url.toString(),
      metadata: {
        orderNumber: order.orderNumber,
        configuredUrl: baseUrl
      }
    };
  }
};

function getPaymentProvider(provider?: PaymentProviderName): PaymentProvider {
  const selected = provider || configuredPaymentProvider();
  if (selected === 'domestic_redirect') return domesticRedirectProvider;
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

  const provider = getPaymentProvider(input.provider);
  const result = await provider.createAttempt(order);

  const attempt = await prisma.checkoutPaymentAttempt.create({
    data: {
      orderId: order.id,
      provider: result.provider,
      status: result.status,
      amountCents: order.totalCents,
      currency: order.currency,
      providerReference: result.providerReference,
      redirectUrl: result.redirectUrl,
      metadata: result.metadata
    }
  });

  await prisma.checkoutOrder.update({
    where: { id: order.id },
    data: { status: 'pending_payment' }
  });

  return attempt;
}
