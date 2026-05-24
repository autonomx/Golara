import 'server-only';

import type { Prisma } from '@prisma/client';
import type { CheckoutOrderSummary } from '@/lib/catalog';
import { hasDatabase, prisma } from '@/lib/prisma';

export type AdminOrderFilters = {
  status?: string;
  paymentStatus?: string;
  search?: string;
};

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
  timelineEvents: { title: string; createdAt: Date }[];
};

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function buildOrderWhere(filters: AdminOrderFilters = {}): Prisma.CheckoutOrderWhereInput {
  const status = optionalText(filters.status);
  const paymentStatus = optionalText(filters.paymentStatus);
  const search = optionalText(filters.search);
  const where: Prisma.CheckoutOrderWhereInput = {};

  if (status) where.status = status;
  if (paymentStatus) {
    where.paymentAttempts = { some: { status: paymentStatus } };
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { phone: { contains: search, mode: 'insensitive' } } },
      { customer: { displayName: { contains: search, mode: 'insensitive' } } },
      { items: { some: { productTitle: { contains: search, mode: 'insensitive' } } } }
    ];
  }

  return where;
}

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
    latestTimelineTitle: order.timelineEvents[0]?.title,
    createdAt: order.createdAt
  };
}

export async function listAdminCheckoutOrders(filters: AdminOrderFilters = {}, limit = 12): Promise<CheckoutOrderSummary[]> {
  if (!hasDatabase()) return [];

  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const orders = await prisma.checkoutOrder.findMany({
    where: buildOrderWhere(filters),
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
    include: {
      customer: { select: { phone: true, displayName: true } },
      items: { select: { id: true } },
      paymentAttempts: {
        select: { status: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      timelineEvents: {
        select: { title: true, createdAt: true },
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
