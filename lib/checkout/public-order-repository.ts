import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export async function getPublicOrderByToken(token: string) {
  const normalized = token.trim();
  if (!hasDatabase() || normalized.length < 16) return null;

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
          provider: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
}
