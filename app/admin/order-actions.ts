'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { assignAdminOrderCustomer } from '@/lib/checkout/admin-order-assignment-repository';
import { addAdminOrderLineItem, parseAdminOrderLineSelection, removeAdminOrderLineItem, updateAdminOrderLineItemQuantity } from '@/lib/checkout/admin-order-line-repository';
import { transitionCheckoutFulfillmentStatus, transitionCheckoutOrderStatus } from '@/lib/checkout/checkout-status-service';
import { assertCheckoutFulfillmentStatus, assertCheckoutOrderStatus } from '@/lib/checkout/checkout-state-machine';
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
  const order = await addAdminOrderLineItem(orderId, {
    ...selection,
    quantity: integerFormValue(formData, 'quantity'),
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: 'order.line_item.add',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Added line item to order ${order.orderNumber}`,
    metadata: {
      productId: selection.productId,
      variantId: selection.variantId ?? null,
      quantity: integerFormValue(formData, 'quantity')
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

export async function addOrderTimelineNoteAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const note = stringFormValue(formData, 'note');
  if (note.length < 2) throw new Error('Timeline note is required.');

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

  const fulfillmentStatus = assertCheckoutFulfillmentStatus(stringFormValue(formData, 'fulfillmentStatus'));
  const fulfillmentNote = stringFormValue(formData, 'fulfillmentNote');
  const courierName = stringFormValue(formData, 'courierName');
  const courierPhone = stringFormValue(formData, 'courierPhone');
  const existingOrder = await prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    select: { fulfillmentStatus: true, orderNumber: true }
  });
  if (!existingOrder) throw new Error('Order not found.');

  const order = await transitionCheckoutFulfillmentStatus({
    orderId,
    to: fulfillmentStatus,
    note: fulfillmentNote,
    actorLabel: actor.label,
    actorRole: actor.role
  });

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
