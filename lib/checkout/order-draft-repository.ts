import 'server-only';

import { randomBytes } from 'node:crypto';
import { reserveOrderInventory } from '@/lib/inventory/inventory-reservation-service';
import { hasDatabase, prisma } from '@/lib/prisma';

type OrderDraftItemInput = {
  productId: string;
  variantId?: string;
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

export type CreateStaffOrderDraftInput = {
  currency?: string;
  recipientName?: string;
  recipientPhone?: string;
  staffNotes?: string;
  actorLabel: string;
  actorRole: string;
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

function makePublicLookupToken() {
  return randomBytes(24).toString('base64url');
}

function normalizeItems(items: OrderDraftItemInput[]) {
  const quantities = new Map<string, OrderDraftItemInput>();
  for (const item of items) {
    const productId = optionalText(item.productId);
    if (!productId) continue;
    const variantId = optionalText(item.variantId);
    const lineKey = variantId ?? productId;
    const existing = quantities.get(lineKey);
    quantities.set(lineKey, {
      productId,
      variantId,
      quantity: (existing?.quantity ?? 0) + normalizeQuantity(item.quantity)
    });
  }
  return [...quantities.values()].map((item) => ({ ...item, quantity: Math.min(99, item.quantity) }));
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
      currency: true,
      variants: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, sku: true, name: true, priceCents: true, currency: true }
      }
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
    const variant = item.variantId ? product.variants.find((candidate) => candidate.id === item.variantId) : product.variants[0];
    if (item.variantId && !variant) throw new Error('Product variant is unavailable for checkout.');
    const unitPriceCents = variant?.priceCents ?? product.priceCents;
    const lineTotalCents = unitPriceCents * item.quantity;
    return {
      productId: product.id,
      variantId: variant?.id,
      variantSku: variant?.sku,
      variantName: variant?.name,
      productTitle: product.title,
      productCode: product.code,
      quantity: item.quantity,
      unitPriceCents,
      lineTotalCents
    };
  });
  const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const deliveryCents = 0;
  const discountCents = 0;
  const totalCents = subtotalCents + deliveryCents - discountCents;

  return prisma.$transaction(async (tx) => {
    const order = await tx.checkoutOrder.create({
      data: {
        orderNumber: makeOrderNumber(),
        publicLookupToken: makePublicLookupToken(),
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

    await reserveOrderInventory(order.id, tx);
    return order;
  });
}

export async function createStaffOrderDraft(input: CreateStaffOrderDraftInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout order drafts.');

  const staffNotes = optionalText(input.staffNotes);
  return prisma.checkoutOrder.create({
    data: {
      orderNumber: makeOrderNumber(),
      publicLookupToken: makePublicLookupToken(),
      checkoutMode: 'assisted',
      currency: normalizeCurrency(input.currency),
      recipientName: optionalText(input.recipientName),
      recipientPhone: optionalText(input.recipientPhone),
      staffNotes,
      timelineEvents: {
        create: {
          type: 'staff_draft_created',
          title: 'Staff draft created',
          note: staffNotes,
          actorLabel: input.actorLabel,
          actorRole: input.actorRole
        }
      }
    },
    include: {
      items: true,
      customer: true,
      address: true,
      timelineEvents: true
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
