import 'server-only';

import type { Prisma } from '@prisma/client';
import { reserveOrderInventory, releaseOrderInventoryReservations } from '@/lib/inventory/inventory-reservation-service';
import { hasDatabase, prisma } from '@/lib/prisma';

type OrderLineActor = {
  actorLabel?: string;
  actorRole?: string;
};

export type AdminOrderLineProductOption = {
  value: string;
  label: string;
  productId: string;
  variantId?: string;
  priceCents: number;
  currency: string;
};

export type AdminOrderLineSelection = {
  productId: string;
  variantId?: string;
};

type OrderTotals = {
  deliveryCents: number;
  discountCents: number;
};

const EDITABLE_ORDER_STATUSES = new Set(['draft', 'pending']);

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(99, Math.floor(quantity)));
}

function lineOptionValue(productId: string, variantId?: string | null) {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function parseAdminOrderLineSelection(value: string): AdminOrderLineSelection {
  const [productId, variantId] = value.split('::').map((part) => part.trim());
  if (!productId) throw new Error('Product selection is required.');
  return { productId, variantId: optionalText(variantId) };
}

export function isAdminOrderLineEditable(status: string) {
  return EDITABLE_ORDER_STATUSES.has(status);
}

function assertEditableOrder(order: { status: string }) {
  if (!isAdminOrderLineEditable(order.status)) {
    throw new Error('Order line items can only be edited before confirmation.');
  }
}

async function recalculateOrderTotals(tx: Prisma.TransactionClient, orderId: string, totals: OrderTotals) {
  const items = await tx.checkoutOrderItem.findMany({
    where: { orderId },
    select: { lineTotalCents: true }
  });
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const totalCents = subtotalCents + totals.deliveryCents - totals.discountCents;

  return tx.checkoutOrder.update({
    where: { id: orderId },
    data: { subtotalCents, totalCents },
    select: { id: true, orderNumber: true, status: true, subtotalCents: true, totalCents: true }
  });
}

async function findEditableOrder(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.checkoutOrder.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true, deliveryCents: true, discountCents: true }
  });
  if (!order) throw new Error('Order not found.');
  assertEditableOrder(order);
  return order;
}

async function rebuildHeldReservations(tx: Prisma.TransactionClient, orderId: string) {
  await releaseOrderInventoryReservations(orderId, tx);
  await reserveOrderInventory(orderId, tx);
}

export async function listAdminOrderLineProductOptions(): Promise<AdminOrderLineProductOption[]> {
  if (!hasDatabase()) return [];

  const products = await prisma.product.findMany({
    where: { isActive: true, category: { isActive: true } },
    orderBy: [{ title: 'asc' }],
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

  return products.flatMap((product) => {
    if (!product.variants.length) {
      return [{
        value: lineOptionValue(product.id),
        label: `${product.title} (${product.code})`,
        productId: product.id,
        priceCents: product.priceCents,
        currency: product.currency
      }];
    }

    return product.variants.map((variant) => ({
      value: lineOptionValue(product.id, variant.id),
      label: `${product.title} / ${variant.name} (${variant.sku})`,
      productId: product.id,
      variantId: variant.id,
      priceCents: variant.priceCents,
      currency: variant.currency
    }));
  });
}

export async function addAdminOrderLineItem(orderId: string, input: AdminOrderLineSelection & { quantity: number } & OrderLineActor) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for order line item edits.');

  return prisma.$transaction(async (tx) => {
    const order = await findEditableOrder(tx, orderId);
    const quantity = normalizeQuantity(input.quantity);
    const product = await tx.product.findFirst({
      where: { id: input.productId, isActive: true, category: { isActive: true } },
      select: {
        id: true,
        title: true,
        code: true,
        priceCents: true,
        variants: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, sku: true, name: true, priceCents: true }
        }
      }
    });
    if (!product) throw new Error('Product is unavailable for order editing.');

    const variant = input.variantId ? product.variants.find((candidate) => candidate.id === input.variantId) : undefined;
    if (input.variantId && !variant) throw new Error('Product variant is unavailable for order editing.');

    await releaseOrderInventoryReservations(orderId, tx);

    const unitPriceCents = variant?.priceCents ?? product.priceCents;
    const existing = await tx.checkoutOrderItem.findFirst({
      where: { orderId, productId: product.id, variantId: variant?.id ?? null }
    });
    if (existing) {
      const nextQuantity = normalizeQuantity(existing.quantity + quantity);
      await tx.checkoutOrderItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity, unitPriceCents, lineTotalCents: unitPriceCents * nextQuantity }
      });
    } else {
      await tx.checkoutOrderItem.create({
        data: {
          orderId,
          productId: product.id,
          variantId: variant?.id,
          variantSku: variant?.sku,
          variantName: variant?.name,
          productTitle: product.title,
          productCode: product.code,
          quantity,
          unitPriceCents,
          lineTotalCents: unitPriceCents * quantity
        }
      });
    }

    const updated = await recalculateOrderTotals(tx, orderId, order);
    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId,
        type: 'order_line_item_added',
        title: `Line item added: ${product.title}`,
        actorLabel: optionalText(input.actorLabel),
        actorRole: optionalText(input.actorRole),
        metadata: { productId: product.id, variantId: variant?.id ?? null, quantity }
      }
    });
    await rebuildHeldReservations(tx, orderId);
    return updated;
  });
}

export async function updateAdminOrderLineItemQuantity(orderId: string, itemId: string, input: { quantity: number } & OrderLineActor) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for order line item edits.');

  return prisma.$transaction(async (tx) => {
    const order = await findEditableOrder(tx, orderId);
    const quantity = normalizeQuantity(input.quantity);
    const item = await tx.checkoutOrderItem.findFirst({ where: { id: itemId, orderId } });
    if (!item) throw new Error('Order line item not found.');

    await releaseOrderInventoryReservations(orderId, tx);
    await tx.checkoutOrderItem.update({
      where: { id: item.id },
      data: { quantity, lineTotalCents: item.unitPriceCents * quantity }
    });

    const updated = await recalculateOrderTotals(tx, orderId, order);
    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId,
        type: 'order_line_item_updated',
        title: `Line item quantity updated: ${item.productTitle}`,
        actorLabel: optionalText(input.actorLabel),
        actorRole: optionalText(input.actorRole),
        metadata: { itemId: item.id, fromQuantity: item.quantity, toQuantity: quantity }
      }
    });
    await rebuildHeldReservations(tx, orderId);
    return updated;
  });
}

export async function removeAdminOrderLineItem(orderId: string, itemId: string, actor: OrderLineActor = {}) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for order line item edits.');

  return prisma.$transaction(async (tx) => {
    const order = await findEditableOrder(tx, orderId);
    const item = await tx.checkoutOrderItem.findFirst({ where: { id: itemId, orderId } });
    if (!item) throw new Error('Order line item not found.');

    await releaseOrderInventoryReservations(orderId, tx);
    await tx.checkoutOrderItem.delete({ where: { id: item.id } });

    const updated = await recalculateOrderTotals(tx, orderId, order);
    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId,
        type: 'order_line_item_removed',
        title: `Line item removed: ${item.productTitle}`,
        actorLabel: optionalText(actor.actorLabel),
        actorRole: optionalText(actor.actorRole),
        metadata: { itemId: item.id, productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity }
      }
    });
    await rebuildHeldReservations(tx, orderId);
    return updated;
  });
}
