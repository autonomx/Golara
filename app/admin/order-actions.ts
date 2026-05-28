'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { transitionCheckoutFulfillmentStatus, transitionCheckoutOrderStatus } from '@/lib/checkout/checkout-status-service';
import { assertCheckoutFulfillmentStatus, assertCheckoutOrderStatus } from '@/lib/checkout/checkout-state-machine';
import { hasDatabase, prisma } from '@/lib/prisma';

function stringFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function adminPath(status: string) {
  const params = new URLSearchParams({ status });
  return `/admin?${params.toString()}#orders`;
}

function orderDetailPath(orderId: string, status: string) {
  const params = new URLSearchParams({ status });
  return `/admin/orders/${orderId}?${params.toString()}`;
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
  redirect(adminPath('order-updated'));
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
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailPath(orderId, 'fulfillment-updated'));
}
