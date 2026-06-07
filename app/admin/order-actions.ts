'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { assignAdminOrderCustomer } from '@/lib/checkout/admin-order-assignment-repository';
import { addAdminOrderLineItem, isAdminOrderLineEditable, parseAdminOrderLineSelection, removeAdminOrderLineItem, updateAdminOrderLineItemQuantity } from '@/lib/checkout/admin-order-line-repository';
import { queueAdminOrderNotificationAction, recordAdminOrderNotificationAttempt } from '@/lib/checkout/admin-order-notification-repository';
import { transitionCheckoutFulfillmentStatus, transitionCheckoutOrderStatus, transitionCheckoutPaymentStatus } from '@/lib/checkout/checkout-status-service';
import { assertCheckoutFulfillmentStatus, assertCheckoutOrderStatus } from '@/lib/checkout/checkout-state-machine';
import { markOrderManualPayment } from '@/lib/checkout/manual-payment-repository';
import { createStaffOrderDraft } from '@/lib/checkout/order-draft-repository';
import { hasDatabase, prisma } from '@/lib/prisma';

function stringFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function integerFormValue(formData: FormData, name: string, fallback = 1) {
  const parsed = Number.parseInt(stringFormValue(formData, name), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function adminPath(status: string) {
  const params = new URLSearchParams({ status });
  return `/admin/orders?${params.toString()}`;
}

function orderDetailPath(orderId: string, status: string) {
  const params = new URLSearchParams({ status });
  return `/admin/orders/${orderId}?${params.toString()}`;
}

function orderLineAddFailureStatus(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Product selection is required')) return 'order-line-product-required';
  if (message.includes('Product is unavailable')) return 'order-line-product-unavailable';
  if (message.includes('Product variant is unavailable')) return 'order-line-variant-unavailable';
  if (message.includes('Order not found')) return 'order-not-found';
  if (message.includes('Order line items can only be edited')) return 'order-line-not-editable';
  return undefined;
}

export async function createStaffDraftOrderAction(formData: FormData) {
  const actor = await assertAdminRole('staff');

  const order = await createStaffOrderDraft({
    currency: stringFormValue(formData, 'currency') || 'TOMAN',
    recipientName: stringFormValue(formData, 'recipientName'),
    recipientPhone: stringFormValue(formData, 'recipientPhone'),
    staffNotes: stringFormValue(formData, 'staffNotes'),
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: 'order.staff_draft.create',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Created staff draft order ${order.orderNumber}`,
    metadata: {
      checkoutMode: order.checkoutMode,
      recipientAdded: Boolean(order.recipientName || order.recipientPhone),
      staffNotesAdded: Boolean(order.staffNotes)
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  redirect(orderDetailPath(order.id, 'staff-draft-created'));
}

export async function updateOrderStatusAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const status = assertCheckoutOrderStatus(stringFormValue(formData, 'status'));
  const staffNotes = stringFormValue(formData, 'staffNotes');
  const existingOrder = await prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    select: { status: true, orderNumber: true }
  });
  if (!existingOrder) throw new Error('Order not found.');

  const order = await transitionCheckoutOrderStatus({
    orderId,
    to: status,
    note: staffNotes,
    actorLabel: actor.label,
    actorRole: actor.role
  });

  if (staffNotes) {
    await prisma.checkoutOrder.update({ where: { id: orderId }, data: { staffNotes } });
  }

  await recordAdminAuditLog({
    action: 'order.status.update',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Updated order ${existingOrder.orderNumber} from ${existingOrder.status} to ${status}`,
    metadata: {
      previousStatus: existingOrder.status,
      status,
      staffNotesUpdated: Boolean(staffNotes)
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  redirect(adminPath('order-updated'));
}

export async function addOrderLineItemAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  const selection = parseAdminOrderLineSelection(stringFormValue(formData, 'lineOption'));
  const requestedQuantity = integerFormValue(formData, 'quantity');
  let order: Awaited<ReturnType<typeof addAdminOrderLineItem>>;

  try {
    order = await addAdminOrderLineItem(orderId, {
      ...selection,
      quantity: requestedQuantity,
      actorLabel: actor.label,
      actorRole: actor.role
    });
  } catch (error) {
    const status = orderLineAddFailureStatus(error);
    if (status) redirect(orderDetailPath(orderId, status));
    throw error;
  }

  await recordAdminAuditLog({
    action: 'order.line_item.add',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Added line item to order ${order.orderNumber}`,
    metadata: {
      productId: selection.productId,
      variantId: selection.variantId ?? null,
      quantity: requestedQuantity
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'order-line-added'));
}

export async function updateOrderLineItemQuantityAction(orderId: string, itemId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  const quantity = integerFormValue(formData, 'quantity');
  const order = await updateAdminOrderLineItemQuantity(orderId, itemId, {
    quantity,
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: 'order.line_item.update',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Updated line item quantity on order ${order.orderNumber}`,
    metadata: { itemId, quantity }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'order-line-updated'));
}

export async function removeOrderLineItemAction(orderId: string, itemId: string, _formData?: FormData) {
  const actor = await assertAdminRole('staff');
  const order = await removeAdminOrderLineItem(orderId, itemId, {
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: 'order.line_item.remove',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Removed line item from order ${order.orderNumber}`,
    metadata: { itemId }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'order-line-removed'));
}

export async function updateOrderDiscountAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const requestedDiscountCents = Math.max(0, integerFormValue(formData, 'discountCents', 0));
  const note = stringFormValue(formData, 'discountNote');
  const existing = await prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true, subtotalCents: true, deliveryCents: true, discountCents: true }
  });
  if (!existing) throw new Error('Order not found.');
  if (!isAdminOrderLineEditable(existing.status)) throw new Error('Order discounts can only be edited before confirmation.');

  const maxDiscountCents = existing.subtotalCents + existing.deliveryCents;
  const discountCents = Math.min(requestedDiscountCents, maxDiscountCents);
  const totalCents = existing.subtotalCents + existing.deliveryCents - discountCents;
  const order = await prisma.checkoutOrder.update({
    where: { id: orderId },
    data: {
      discountCents,
      totalCents,
      timelineEvents: {
        create: {
          type: 'order_discount_updated',
          title: `Order discount updated from ${existing.discountCents} to ${discountCents}`,
          note: note || undefined,
          actorLabel: actor.label,
          actorRole: actor.role,
          metadata: { fromDiscountCents: existing.discountCents, toDiscountCents: discountCents }
        }
      }
    },
    select: { id: true, orderNumber: true }
  });

  await recordAdminAuditLog({
    action: 'order.discount.update',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Updated discount for order ${order.orderNumber}`,
    metadata: { fromDiscountCents: existing.discountCents, toDiscountCents: discountCents, clamped: discountCents !== requestedDiscountCents }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'order-discount-updated'));
}
