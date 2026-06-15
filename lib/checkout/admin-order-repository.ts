import 'server-only';

import type { Prisma } from '@prisma/client';
import type { CheckoutOrderSummary } from '@/lib/catalog';
import { mapAdminOrderActivityTimeline } from '@/lib/checkout/admin-order-activity-timeline';
import { hasDatabase, prisma } from '@/lib/prisma';

export type AdminOrderFilters = {
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  search?: string;
};

export type AdminOrderPage = {
  orders: CheckoutOrderSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type DbOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  checkoutMode: string;
  fulfillmentStatus: string;
  currency: string;
  totalCents: number;
  createdAt: Date;
  customer?: {
    phone: string;
    displayName: string | null;
  } | null;
  _count: { items: number };
  paymentAttempts: { status: string; provider: string; metadata: Prisma.JsonValue | null }[];
  timelineEvents: { title: string; createdAt: Date }[];
};

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function safePage(value = 1) {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

function safePageSize(value = 12) {
  return Number.isFinite(value) ? Math.max(1, Math.min(50, Math.floor(value))) : 12;
}

function metadataObject(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {} as Record<string, Prisma.JsonValue>;
  return value as Record<string, Prisma.JsonValue>;
}

function textMetadataValue(value: Prisma.JsonValue | undefined) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function booleanMetadataValue(value: Prisma.JsonValue | undefined) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return undefined;
}

function buildOrderWhere(filters: AdminOrderFilters = {}): Prisma.CheckoutOrderWhereInput {
  const status = optionalText(filters.status);
  const paymentStatus = optionalText(filters.paymentStatus);
  const fulfillmentStatus = optionalText(filters.fulfillmentStatus);
  const search = optionalText(filters.search);
  const where: Prisma.CheckoutOrderWhereInput = {};

  if (status) where.status = status;
  if (fulfillmentStatus) where.fulfillmentStatus = fulfillmentStatus;
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
  const latestPayment = order.paymentAttempts[0];
  const paymentMetadata = metadataObject(latestPayment?.metadata);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    checkoutMode: order.checkoutMode,
    fulfillmentStatus: order.fulfillmentStatus,
    currency: order.currency,
    totalCents: order.totalCents,
    customerPhone: order.customer?.phone,
    customerName: order.customer?.displayName ?? undefined,
    itemCount: order._count.items,
    latestPaymentStatus: order.paymentAttempts[0]?.status,
    latestPaymentProvider: latestPayment?.provider,
    latestPaymentMethodKey: textMetadataValue(paymentMetadata.paymentMethodKey),
    latestPaymentMethodLabel: textMetadataValue(paymentMetadata.paymentMethodLabel),
    latestPaymentMethodType: textMetadataValue(paymentMetadata.paymentMethodType),
    latestPaymentRequiresManualReview: booleanMetadataValue(paymentMetadata.paymentRequiresManualReview),
    latestTimelineTitle: order.timelineEvents[0]?.title,
    createdAt: order.createdAt
  };
}

async function readOrderSummaries(where: Prisma.CheckoutOrderWhereInput, take: number, skip = 0) {
  return prisma.checkoutOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    skip,
    include: {
      customer: { select: { phone: true, displayName: true } },
      _count: { select: { items: true } },
      paymentAttempts: {
        select: { status: true, provider: true, metadata: true },
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
}

export async function listAdminCheckoutOrders(filters: AdminOrderFilters = {}, limit = 12): Promise<CheckoutOrderSummary[]> {
  if (!hasDatabase()) return [];

  const orders = await readOrderSummaries(buildOrderWhere(filters), safePageSize(limit));
  return orders.map(mapOrderSummary);
}

export async function listAdminCheckoutOrderPage(filters: AdminOrderFilters = {}, page = 1, pageSize = 12): Promise<AdminOrderPage> {
  if (!hasDatabase()) {
    return { orders: [], page: 1, pageSize, totalCount: 0, totalPages: 1 };
  }

  const safePageSizeValue = safePageSize(pageSize);
  const currentPage = safePage(page);
  const where = buildOrderWhere(filters);
  const [totalCount, orders] = await Promise.all([
    prisma.checkoutOrder.count({ where }),
    readOrderSummaries(where, safePageSizeValue, (currentPage - 1) * safePageSizeValue)
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSizeValue));

  return {
    orders: orders.map(mapOrderSummary),
    page: Math.min(currentPage, totalPages),
    pageSize: safePageSizeValue,
    totalCount,
    totalPages
  };
}

export async function listAdminCheckoutOrdersForExport(filters: AdminOrderFilters = {}): Promise<CheckoutOrderSummary[]> {
  if (!hasDatabase()) return [];

  const orders = await readOrderSummaries(buildOrderWhere(filters), 500);
  return orders.map(mapOrderSummary);
}

export async function getAdminCheckoutOrder(orderId: string) {
  if (!hasDatabase()) return null;

  const order = await prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      address: true,
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          stockReservations: {
            orderBy: { createdAt: 'asc' },
            include: {
              variantStock: {
                include: { location: true }
              }
            }
          }
        }
      },
      paymentAttempts: {
        orderBy: { createdAt: 'desc' },
        include: { events: { orderBy: { createdAt: 'desc' } } }
      },
      timelineEvents: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!order) return null;

  return {
    ...order,
    activityTimeline: mapAdminOrderActivityTimeline(order.timelineEvents)
  };
}
