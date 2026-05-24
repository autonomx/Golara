'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

const allowedOrderStatuses = ['draft', 'pending_payment', 'paid', 'preparing', 'out_for_delivery', 'fulfilled', 'cancelled'];

function stringFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function adminPath(status: string) {
  const params = new URLSearchParams({ status });
  return `/admin?${params.toString()}#orders`;
}

export async function updateOrderStatusAction(orderId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const status = stringFormValue(formData, 'status');
  const staffNotes = stringFormValue(formData, 'staffNotes');

  if (!allowedOrderStatuses.includes(status)) throw new Error('Invalid order status.');

  const existingOrder = await prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    select: { status: true, orderNumber: true }
  });
  if (!existingOrder) throw new Error('Order not found.');

  const order = await prisma.checkoutOrder.update({
    where: { id: orderId },
    data: {
      status,
      staffNotes: staffNotes || undefined,
      timelineEvents: {
        create: {
          type: 'status_changed',
          title: `Status changed to ${status}`,
          note: staffNotes || undefined,
          actorLabel: actor.label,
          actorRole: actor.role,
          metadata: {
            previousStatus: existingOrder.status,
            status
          }
        }
      }
    }
  });

  await recordAdminAuditLog({
    action: 'order.status.update',
    entity: 'checkoutOrder',
    entityId: order.id,
    summary: `Updated order ${order.orderNumber} from ${existingOrder.status} to ${status}`,
    metadata: {
      previousStatus: existingOrder.status,
      status,
      staffNotesUpdated: Boolean(staffNotes)
    }
  });

  revalidatePath('/admin');
  redirect(adminPath('order-updated'));
}
