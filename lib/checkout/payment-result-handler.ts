import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

type CheckoutResultStatus = 'paid' | 'failed' | 'cancelled';

type CheckoutResultInput = {
  orderNumber: string;
  token: string;
  status: string;
  providerReference?: string;
};

const FINAL_ATTEMPT_STATUSES = new Set(['verified_paid', 'cancelled', 'failed']);

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

function shouldUpdateAttempt(currentStatus: string, nextStatus: string) {
  if (currentStatus === nextStatus) return false;
  if (currentStatus === 'verified_paid') return false;
  if (FINAL_ATTEMPT_STATUSES.has(currentStatus) && nextStatus !== 'verified_paid') return false;
  return true;
}

function nextOrderStatus(currentStatus: string, status: CheckoutResultStatus) {
  if (currentStatus === 'paid') return 'paid';
  if (status === 'paid') return 'paid';
  return currentStatus;
}

export async function applyCheckoutResult(input: CheckoutResultInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout result handling.');

  const orderNumber = input.orderNumber.trim();
  const token = input.token.trim();
  if (!orderNumber || token.length < 16) throw new Error('Invalid order result reference.');

  const status = normalizeStatus(input.status);
  const providerReference = optionalText(input.providerReference);
  const order = await prisma.checkoutOrder.findFirst({
    where: { orderNumber, publicLookupToken: token },
    include: {
      paymentAttempts: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      timelineEvents: {
        where: { type: 'payment_result' },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!order) throw new Error('Order result reference was not found.');

  const latestAttempt = order.paymentAttempts[0];
  const nextAttemptStatus = attemptStatus(status);
  let attemptChanged = false;

  if (latestAttempt && shouldUpdateAttempt(latestAttempt.status, nextAttemptStatus)) {
    await prisma.checkoutPaymentAttempt.update({
      where: { id: latestAttempt.id },
      data: {
        status: nextAttemptStatus,
        providerReference: providerReference || latestAttempt.providerReference,
        metadata: {
          resultStatus: status,
          providerReference: providerReference || latestAttempt.providerReference || '',
          source: 'checkout-result-handler'
        }
      }
    });
    attemptChanged = true;
  }

  const updatedOrderStatus = nextOrderStatus(order.status, status);
  const statusChanged = updatedOrderStatus !== order.status;
  const lastEvent = order.timelineEvents[0];
  const duplicateLatestEvent = Boolean(
    lastEvent &&
      lastEvent.title === eventTitle(status) &&
      lastEvent.createdAt.getTime() > Date.now() - 5 * 60 * 1000
  );

  if (statusChanged || attemptChanged || !duplicateLatestEvent) {
    await prisma.checkoutOrder.update({
      where: { id: order.id },
      data: {
        status: updatedOrderStatus,
        timelineEvents: duplicateLatestEvent
          ? undefined
          : {
              create: {
                type: 'payment_result',
                title: eventTitle(status),
                metadata: {
                  resultStatus: status,
                  providerReference: providerReference || '',
                  idempotent: !attemptChanged && !statusChanged
                }
              }
            }
      }
    });
  }

  return {
    orderNumber: order.orderNumber,
    publicLookupToken: order.publicLookupToken,
    status,
    orderStatus: updatedOrderStatus,
    attemptChanged,
    timelineChanged: !duplicateLatestEvent
  };
}
