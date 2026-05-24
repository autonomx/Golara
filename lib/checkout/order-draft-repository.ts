import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

type OrderDraftItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderDraftInput = {
  customerId?: string;
  addressId?: string;
  checkoutMode?: string;
  currency?: string;
  deliveryDate?: Date;
  deliveryWindow?: string;
  recipientName?: string;
  recipientPhone?: string;
  customerNote?: string;
  items: OrderDraftItemInput[];
};

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(99, Math.floor(quantity)));
}

function normalizeCheckoutMode(mode?: string) {
  const normalized = mode?.trim().toLowerCase();
  if (normalized === 'assisted' || normalized === 'gateway') return normalized;
  return 'inquiry';
}

function normalizeCurrency(currency?: string) {
  return optionalText(currency)?.toUpperCase() || 'TOMAN';
}

function makeOrderNumber() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GL-${timestamp}-${suffix}`;
}

function normalizeItems(items: OrderDraftItemInput[]) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    const productId = optionalText(item.productId);
    if (!productId) continue;
    quantities.set(productId, (quantities.get(productId) ?? 0) + normalizeQuantity(item.quantity));
  }
  return [...quantities.entries()].map(([productId, quantity]) => ({ productId, quantity: Math.min(99, quantity) }));
}

export async function createOrderDraft(input: CreateOrderDraftInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout order drafts.');

  const items = normalizeItems(input.items);
  if (items.length === 0) throw new Error('At least one product is required for an order draft.');

  const products = await prisma.product.findMany({
    where: {
      id: { in: items.map((item) => item.productId) },
      isActive: true,
      category: { isActive: true }
    },
    select: {
      id: true,
      title: true,
      code: true,
      priceCents: true,
      currency: true
    }
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  if (products.length !== items.length) {
    throw new Error('One or more products are unavailable for checkout.');
  }

  const currency = normalizeCurrency(input.currency || products[0]?.currency || 'TOMAN');
  const orderItems = items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) throw new Error('Product is unavailable for checkout.');
    const lineTotalCents = product.priceCents * item.quantity;
    return {
      productId: product.id,
      productTitle: product.title,
      productCode: product.code,
      quantity: item.quantity,
      unitPriceCents: product.priceCents,
      lineTotalCents
    };
  });
  const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const deliveryCents = 0;
  const discountCents = 0;
  const totalCents = subtotalCents + deliveryCents - discountCents;

  return prisma.checkoutOrder.create({
    data: {
      orderNumber: makeOrderNumber(),
      customerId: optionalText(input.customerId),
      addressId: optionalText(input.addressId),
      checkoutMode: normalizeCheckoutMode(input.checkoutMode),
      currency,
      subtotalCents,
      deliveryCents,
      discountCents,
      totalCents,
      deliveryDate: input.deliveryDate,
      deliveryWindow: optionalText(input.deliveryWindow),
      recipientName: optionalText(input.recipientName),
      recipientPhone: optionalText(input.recipientPhone),
      customerNote: optionalText(input.customerNote),
      items: {
        create: orderItems
      }
    },
    include: {
      items: true,
      customer: true,
      address: true
    }
  });
}

export async function getOrderDraft(orderId: string) {
  if (!hasDatabase()) return null;

  return prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: true,
      address: true
    }
  });
}
