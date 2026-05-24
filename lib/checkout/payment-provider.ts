import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export type PaymentProviderName = 'manual';

type CreatePaymentAttemptInput = {
  orderId: string;
  provider?: PaymentProviderName;
};

type PaymentProviderResult = {
  provider: PaymentProviderName;
  status: 'manual_pending' | 'created';
  providerReference?: string;
  redirectUrl?: string;
  metadata?: Record<string, string | number | boolean>;
};

type PaymentProvider = {
  name: PaymentProviderName;
  createAttempt(order: { id: string; orderNumber: string; totalCents: number; currency: string }): Promise<PaymentProviderResult>;
};

function configuredPaymentProvider(): PaymentProviderName {
  const provider = process.env.CHECKOUT_DOMESTIC_GATEWAY_PROVIDER?.trim().toLowerCase() || 'manual';
  if (provider === 'manual') return 'manual';
  console.warn('[checkout] unsupported CHECKOUT_DOMESTIC_GATEWAY_PROVIDER; using manual', { provider });
  return 'manual';
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

function getPaymentProvider(provider?: PaymentProviderName): PaymentProvider {
  const selected = provider || configuredPaymentProvider();
  if (selected === 'manual') return manualPaymentProvider;
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
      status: true
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
