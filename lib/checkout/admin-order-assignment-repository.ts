import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

type AssignmentActor = {
  actorLabel?: string;
  actorRole?: string;
};

export type AdminOrderCustomerAssignmentOption = {
  id: string;
  label: string;
  phone: string;
  email?: string | null;
  addresses: {
    id: string;
    label: string;
    summary: string;
    isDefault: boolean;
  }[];
};

export type AdminOrderCustomerAssignmentInput = {
  customerId?: string;
  addressId?: string;
} & AssignmentActor;

const EDITABLE_ASSIGNMENT_STATUSES = new Set(['draft', 'pending']);

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function isEditableAssignmentStatus(status: string) {
  return EDITABLE_ASSIGNMENT_STATUSES.has(status);
}

export async function listAdminOrderCustomerAssignmentOptions(): Promise<AdminOrderCustomerAssignmentOption[]> {
  if (!hasDatabase()) return [];

  const customers = await prisma.customerProfile.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    take: 100,
    include: {
      addresses: { orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] }
    }
  });

  return customers.map((customer) => ({
    id: customer.id,
    label: customer.displayName || customer.phone,
    phone: customer.phone,
    email: customer.email,
    addresses: customer.addresses.map((address) => ({
      id: address.id,
      label: address.label,
      summary: [address.line1, address.line2, address.city].filter(Boolean).join(', '),
      isDefault: address.isDefault
    }))
  }));
}

export async function assignAdminOrderCustomer(orderId: string, input: AdminOrderCustomerAssignmentInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for order customer assignment.');

  return prisma.$transaction(async (tx) => {
    const order = await tx.checkoutOrder.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true }
    });
    if (!order) throw new Error('Order not found.');
    if (!isEditableAssignmentStatus(order.status)) {
      throw new Error('Customer assignment can only be edited before confirmation.');
    }

    const customerId = optionalText(input.customerId);
    const addressId = optionalText(input.addressId);
    const customer = customerId ? await tx.customerProfile.findUnique({
      where: { id: customerId },
      include: { addresses: true }
    }) : null;
    if (customerId && !customer) throw new Error('Customer was not found.');

    const address = addressId ? customer?.addresses.find((candidate) => candidate.id === addressId) : null;
    if (addressId && !address) throw new Error('Address does not belong to the selected customer.');

    const updated = await tx.checkoutOrder.update({
      where: { id: order.id },
      data: {
        customerId: customer?.id ?? null,
        addressId: address?.id ?? null,
        recipientName: customer?.displayName ?? undefined,
        recipientPhone: customer?.phone ?? undefined
      },
      select: { id: true, orderNumber: true, customerId: true, addressId: true }
    });

    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId: order.id,
        type: 'order_customer_assigned',
        title: customer ? `Customer assigned: ${customer.displayName || customer.phone}` : 'Customer assignment cleared',
        actorLabel: optionalText(input.actorLabel),
        actorRole: optionalText(input.actorRole),
        metadata: { customerId: customer?.id ?? null, addressId: address?.id ?? null }
      }
    });

    return updated;
  });
}
