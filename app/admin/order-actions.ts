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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '';
}

function orderLineAddFailureStatus(error: unknown) {
  const message = errorMessage(error);
  if (message.includes('Product selection is required')) return 'order-line-product-required';
  if (message.includes('Product is unavailable')) return 'order-line-product-unavailable';
  if (message.includes('Product variant is unavailable')) return 'order-line-variant-unavailable';
  if (message.includes('Order not found')) return 'order-not-found';
  if (message.includes('Order line items can only be edited')) return 'order-line-not-editable';
  return undefined;
}

function orderStatusFailureStatus(error: unknown) {
  const message = errorMessage(error);
  if (message.includes('Unknown checkout order status')) return 'order-status-invalid';
  if (message.includes('Order not found')) return 'order-not-found';
  return undefined;
}

function fulfillmentFailureStatus(error: unknown) {
  const message = errorMessage(error);
  if (message.includes('Unknown checkout fulfillment status')) return 'fulfillment-status-invalid';
  if (message.includes('Order not found')) return 'order-not-found';
  return undefined;
}

function manualPaymentFailureStatus(error: unknown) {
  const message = errorMessage(error);
  if (message.includes('Payment attempt not found')) return 'manual-payment-not-found';
  if (message.includes('Only manual payment attempts')) return 'manual-payment-not-adjustable';
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

  const staffNotes = stringFormValue(formData, 'staffNotes');
  let status: ReturnType<typeof assertCheckoutOrderStatus>;
  let existingOrder: { status: string; orderNumber: string };
  let order: Awaited<ReturnType<typeof transitionCheckoutOrderStatus>>;

  try {
    status = assertCheckoutOrderStatus(stringFormValue(formData, 'status'));
    const existing = await prisma.checkoutOrder.findUnique({
      where: { id: orderId },
      select: { status: true, orderNumber: true }
    });
    if (!existing) throw new Error('Order not found.');
    existingOrder = existing;

    order = await transitionCheckoutOrderStatus({
      orderId,
      to: status,
      note: staffNotes,
      actorLabel: actor.label,
      actorRole: actor.role
    });

    if (staffNotes) {
      await prisma.checkoutOrder.update({ where: { id: orderId }, data: { staffNotes } });
    }
  } catch (error) {
    const status = orderStatusFailureStatus(error);
    if (status) redirect(orderDetailPath(orderId, status));
    throw error;
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

export async function updateOrderCustomerAssignmentAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  const customerId = stringFormValue(formData, 'customerId');
  const addressId = stringFormValue(formData, 'addressId');
  const order = await assignAdminOrderCustomer(orderId, {
    customerId,
    addressId,
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: 'order.customer.assign',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Updated customer assignment for order ${order.orderNumber}`,
    metadata: {
      customerId: order.customerId,
      addressId: order.addressId
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'order-customer-assigned'));
}

export async function markOrderManualPaymentAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  const amountCents = integerFormValue(formData, 'amountCents', 0);
  const providerReference = stringFormValue(formData, 'providerReference');
  const note = stringFormValue(formData, 'note');
  const attempt = await markOrderManualPayment(orderId, {
    amountCents,
    providerReference,
    note,
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: 'order.payment.manual.mark_paid',
    entity: 'checkoutOrder',
    entityId: attempt.order.id,
    summary: `Marked manual payment paid for order ${attempt.order.orderNumber}`,
    metadata: {
      paymentAttemptId: attempt.id,
      amountCents: attempt.amountCents,
      providerReference: attempt.providerReference
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'manual-payment-marked'));
}

async function transitionManualPaymentAttemptAction(orderId: string, paymentAttemptId: string, to: 'refunded' | 'cancelled', status: string, formData?: FormData) {
  const actor = await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  let updated: Awaited<ReturnType<typeof transitionCheckoutPaymentStatus>>;
  let attempt: { id: string; provider: string; status: string; order: { id: string; orderNumber: string } };

  try {
    const existingAttempt = await prisma.checkoutPaymentAttempt.findFirst({
      where: { id: paymentAttemptId, orderId },
      select: { id: true, provider: true, status: true, order: { select: { id: true, orderNumber: true } } }
    });
    if (!existingAttempt) throw new Error('Payment attempt not found.');
    if (existingAttempt.provider !== 'manual') throw new Error('Only manual payment attempts can be adjusted from admin.');
    attempt = existingAttempt;

    updated = await transitionCheckoutPaymentStatus({
      paymentAttemptId,
      to,
      note: formData ? stringFormValue(formData, 'note') : undefined,
      actorLabel: actor.label,
      actorRole: actor.role
    });
  } catch (error) {
    const status = manualPaymentFailureStatus(error);
    if (status) redirect(orderDetailPath(orderId, status));
    throw error;
  }

  await recordAdminAuditLog({
    action: to === 'refunded' ? 'order.payment.manual.refund' : 'order.payment.manual.void',
    entity: 'checkoutOrder',
    entityId: attempt.order.id,
    summary: `${to === 'refunded' ? 'Refunded' : 'Voided'} manual payment attempt for order ${attempt.order.orderNumber}`,
    metadata: {
      paymentAttemptId: updated.id,
      from: attempt.status,
      to
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, status));
}

export async function refundManualPaymentAttemptAction(orderId: string, paymentAttemptId: string, formData?: FormData) {
  await transitionManualPaymentAttemptAction(orderId, paymentAttemptId, 'refunded', 'manual-payment-refunded', formData);
}

export async function voidManualPaymentAttemptAction(orderId: string, paymentAttemptId: string, formData?: FormData) {
  await transitionManualPaymentAttemptAction(orderId, paymentAttemptId, 'cancelled', 'manual-payment-voided', formData);
}

export async function addOrderTimelineNoteAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const note = stringFormValue(formData, 'note');
  if (note.length < 2) redirect(orderDetailPath(orderId, 'order-note-required'));

  const order = await prisma.checkoutOrder.update({
    where: { id: orderId },
    data: {
      staffNotes: note,
      timelineEvents: {
        create: {
          type: 'staff_note',
          title: 'Staff note added',
          note,
          actorLabel: actor.label,
          actorRole: actor.role
        }
      }
    }
  });

  await recordAdminAuditLog({
    action: 'order.timeline.note.create',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Added staff note to order ${order.orderNumber}`,
    metadata: { noteLength: note.length }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'order-note-added'));
}

export async function updateOrderFulfillmentAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const fulfillmentNote = stringFormValue(formData, 'fulfillmentNote');
  const courierName = stringFormValue(formData, 'courierName');
  const courierPhone = stringFormValue(formData, 'courierPhone');
  let fulfillmentStatus: ReturnType<typeof assertCheckoutFulfillmentStatus>;
  let existingOrder: { fulfillmentStatus: string; orderNumber: string };
  let order: Awaited<ReturnType<typeof transitionCheckoutFulfillmentStatus>>;

  try {
    fulfillmentStatus = assertCheckoutFulfillmentStatus(stringFormValue(formData, 'fulfillmentStatus'));
    const existing = await prisma.checkoutOrder.findUnique({
      where: { id: orderId },
      select: { fulfillmentStatus: true, orderNumber: true }
    });
    if (!existing) throw new Error('Order not found.');
    existingOrder = existing;

    order = await transitionCheckoutFulfillmentStatus({
      orderId,
      to: fulfillmentStatus,
      note: fulfillmentNote,
      actorLabel: actor.label,
      actorRole: actor.role
    });
  } catch (error) {
    const status = fulfillmentFailureStatus(error);
    if (status) redirect(orderDetailPath(orderId, status));
    throw error;
  }

  await prisma.checkoutOrder.update({
    where: { id: orderId },
    data: {
      fulfillmentNote: fulfillmentNote || undefined,
      courierName: courierName || undefined,
      courierPhone: courierPhone || undefined
    }
  });

  await recordAdminAuditLog({
    action: 'order.fulfillment.update',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Updated fulfillment for order ${existingOrder.orderNumber} from ${existingOrder.fulfillmentStatus} to ${fulfillmentStatus}`,
    metadata: {
      previousFulfillmentStatus: existingOrder.fulfillmentStatus,
      fulfillmentStatus,
      courierUpdated: Boolean(courierName || courierPhone)
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'fulfillment-updated'));
}

export async function queueOrderNotificationAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  const result = await queueAdminOrderNotificationAction(orderId, {
    channel: stringFormValue(formData, 'channel'),
    templateKey: stringFormValue(formData, 'templateKey'),
    recipient: stringFormValue(formData, 'recipient'),
    subject: stringFormValue(formData, 'subject'),
    body: stringFormValue(formData, 'body'),
    maxAttempts: integerFormValue(formData, 'maxAttempts', 3),
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: 'order.notification.queue',
    entity: 'checkoutOrder',
    entityId: result.order.id,
    summary: `Queued ${result.notification.channel} notification for order ${result.order.orderNumber}`,
    metadata: {
      notificationId: result.notification.id,
      channel: result.notification.channel,
      templateKey: result.notification.templateKey,
      maxAttempts: result.notification.maxAttempts
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'order-notification-queued'));
}

export async function recordOrderNotificationAttemptAction(orderId: string, notificationId: string, status: 'delivered' | 'failed', formData?: FormData) {
  const actor = await assertAdminRole('staff');
  const notification = await recordAdminOrderNotificationAttempt(notificationId, {
    status,
    errorCode: formData ? stringFormValue(formData, 'errorCode') : undefined,
    errorMessage: formData ? stringFormValue(formData, 'errorMessage') : undefined,
    retryDelayMinutes: formData ? integerFormValue(formData, 'retryDelayMinutes', 15) : 15,
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: status === 'delivered' ? 'order.notification.deliver' : 'order.notification.fail',
    entity: 'checkoutOrder',
    entityId: orderId,
    summary: `Recorded ${notification.channel} notification attempt as ${notification.status}`,
    metadata: {
      notificationId: notification.id,
      channel: notification.channel,
      status: notification.status,
      attemptCount: notification.attemptCount,
      nextRetryAt: notification.nextRetryAt?.toISOString() ?? null
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, status === 'delivered' ? 'order-notification-delivered' : 'order-notification-failed'));
}
