import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

type CheckoutResultStatus = 'paid' | 'failed' | 'cancelled';

type CheckoutResultInput = {
  orderNumber: string;
  token: string;
  status: string;
  providerReference?: string;
};

function normalizeStatus(value: string): CheckoutResultStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'paid' || normalized === 'success' || normalized === 'ok') return 'paid';
  if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'cancel') return 'cancelled';
  return 'failed';
}

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function attemptStatus(status: CheckoutResultStatus) {
  if (status === 'paid') return 'verified_paid';
  if (status === 'cancelled') return 'cancelled';
  return 'failed';
}

function eventTitle(status: CheckoutResultStatus) {
  if (status === 'paid') return 'Payment marked paid';
  if (status === 'cancelled') return 'Payment cancelled';
  return 'Payment failed';
}

export async function applyCheckoutResult(input: CheckoutResultInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout result handling.');

  const orderNumber = input.orderNumber.trim();
  const token = input.token.trim();
  if (!orderNumber || token.length < 16) throw new Error('Invalid order result reference.');

  const status = normalizeStatus(input.status);
  const order = await prisma.checkoutOrder.findFirst({
    where: { orderNumber, publicLookupToken: token },
    include: {
      paymentAttempts: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!order) throw new Error('Order result reference was not found.');

  const latestAttempt = order.paymentAttempts[0];
  if (latestAttempt) {
    await prisma.checkoutPaymentAttempt.update({
      where: { id: latestAttempt.id },
      data: {
        status: attemptStatus(status),
        providerReference: optionalText(input.providerReference) || latestAttempt.providerReference,
        metadata: {
          resultStatus: status,
          providerReference: optionalText(input.providerReference) || latestAttempt.providerReference || '',
          source: 'checkout-result-handler'
        }
      }
    });
  }

  const nextOrderStatus = status === 'paid' ? 'paid' : order.status;
  await prisma.checkoutOrder.update({
    where: { id: order.id },
    data: {
      status: nextOrderStatus,
      timelineEvents: {
        create: {
          type: 'payment_result',
          title: eventTitle(status),
          metadata: {
            resultStatus: status,
            providerReference: optionalText(input.providerReference) || ''
          }
        }
      }
    }
  });

  return {
    orderNumber: order.orderNumber,
    publicLookupToken: order.publicLookupToken,
    status,
    orderStatus: nextOrderStatus
  };
}
