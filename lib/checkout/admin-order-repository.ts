import 'server-only';

import type { CheckoutOrderSummary } from '@/lib/catalog';
import { hasDatabase, prisma } from '@/lib/prisma';

type DbOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  checkoutMode: string;
  currency: string;
  totalCents: number;
  createdAt: Date;
  customer?: {
    phone: string;
    displayName: string | null;
  } | null;
  items: { id: string }[];
  paymentAttempts: { status: string }[];
};

function mapOrderSummary(order: DbOrderSummary): CheckoutOrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    checkoutMode: order.checkoutMode,
    currency: order.currency,
    totalCents: order.totalCents,
    customerPhone: order.customer?.phone,
    customerName: order.customer?.displayName ?? undefined,
    itemCount: order.items.length,
    latestPaymentStatus: order.paymentAttempts[0]?.status,
    createdAt: order.createdAt
  };
}

export async function listAdminCheckoutOrders(limit = 12): Promise<CheckoutOrderSummary[]> {
  if (!hasDatabase()) return [];

  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const orders = await prisma.checkoutOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
    include: {
      customer: { select: { phone: true, displayName: true } },
      items: { select: { id: true } },
      paymentAttempts: {
        select: { status: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  return orders.map(mapOrderSummary);
}

export async function getAdminCheckoutOrder(orderId: string) {
  if (!hasDatabase()) return null;

  return prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      address: true,
      items: { orderBy: { createdAt: 'asc' } },
      paymentAttempts: { orderBy: { createdAt: 'desc' } },
      timelineEvents: { orderBy: { createdAt: 'desc' } }
    }
  });
}
