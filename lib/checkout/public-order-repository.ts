import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

const PUBLIC_ORDER_LOOKUP_TOKEN_MIN_LENGTH = 32;
const PUBLIC_ORDER_LOOKUP_TOKEN_MAX_LENGTH = 128;
const PUBLIC_ORDER_LOOKUP_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

export function normalizePublicOrderLookupToken(token: string) {
  const normalized = token.trim();
  if (normalized.length < PUBLIC_ORDER_LOOKUP_TOKEN_MIN_LENGTH) return null;
  if (normalized.length > PUBLIC_ORDER_LOOKUP_TOKEN_MAX_LENGTH) return null;
  if (!PUBLIC_ORDER_LOOKUP_TOKEN_PATTERN.test(normalized)) return null;
  return normalized;
}

export async function getPublicOrderByToken(token: string) {
  const normalized = normalizePublicOrderLookupToken(token);
  if (!hasDatabase() || !normalized) return null;

  return prisma.checkoutOrder.findUnique({
    where: { publicLookupToken: normalized },
    select: {
      orderNumber: true,
      status: true,
      checkoutMode: true,
      fulfillmentStatus: true,
      currency: true,
      totalCents: true,
      deliveryDate: true,
      deliveryWindow: true,
      createdAt: true,
      items: {
        select: {
          productTitle: true,
          quantity: true
        },
        orderBy: { createdAt: 'asc' }
      },
      timelineEvents: {
        select: {
          type: true,
          title: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      },
      paymentAttempts: {
        select: {
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
}
