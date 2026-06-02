import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import type { AdminIdentity } from '@/lib/admin-auth';
import { hasDatabase, prisma } from '@/lib/prisma';

export type CustomerAddressInput = {
  label?: string;
  recipient?: string;
  phone?: string;
  city?: string;
  line1: string;
  line2?: string;
  notes?: string;
  isDefault?: boolean;
};

export type CustomerProfileInput = {
  phone: string;
  displayName?: string;
  email?: string;
  locale?: string;
};

export type CustomerProfileUpdateInput = {
  displayName?: string;
  email?: string;
  locale?: string;
};

export type AdminCustomerListItem = {
  id: string;
  phone: string;
  displayName?: string | null;
  email?: string | null;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
  accountCount: number;
  addressCount: number;
  orderCount: number;
  lastLoginAt?: Date | null;
};

export type AdminCustomerDetail = AdminCustomerListItem & {
  accounts: {
    id: string;
    provider: string;
    providerAccountId: string;
    email?: string | null;
    phone?: string | null;
    emailVerifiedAt?: Date | null;
    phoneVerifiedAt?: Date | null;
    lastLoginAt?: Date | null;
    createdAt: Date;
  }[];
  addresses: {
    id: string;
    label: string;
    recipient?: string | null;
    phone?: string | null;
    city?: string | null;
    line1: string;
    line2?: string | null;
    notes?: string | null;
    isDefault: boolean;
    updatedAt: Date;
  }[];
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    fulfillmentStatus: string;
    paymentStatus?: string;
    totalCents: number;
    currency: string;
    itemCount: number;
    createdAt: Date;
  }[];
  inquiries: {
    id: string;
    productTitle?: string | null;
    status: string;
    message: string;
    deliveryDate?: Date | null;
    createdAt: Date;
  }[];
  timelineEvents: {
    id: string;
    type: string;
    title: string;
    note?: string | null;
    actorLabel: string;
    actorEmail?: string | null;
    actorRole: string;
    createdAt: Date;
  }[];
};

export function normalizeCustomerPhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) throw new Error('Customer phone is required.');

  const normalized = trimmed
    .replace(/[\s\-()]/g, '')
    .replace(/^0098/, '+98')
    .replace(/^0(\d{10})$/, '+98$1');

  if (!/^\+?\d{8,15}$/.test(normalized)) {
    throw new Error('Customer phone number is invalid.');
  }

  return normalized.startsWith('+') ? normalized : `+${normalized}`;
}

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function optionalEmail(value?: string) {
  const normalized = optionalText(value);
  if (!normalized) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Email is invalid.');
  return normalized;
}

export async function upsertCustomerProfile(input: CustomerProfileInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer profiles.');

  const phone = normalizeCustomerPhone(input.phone);
  return prisma.customerProfile.upsert({
    where: { phone },
    create: {
      phone,
      displayName: optionalText(input.displayName),
      email: optionalEmail(input.email),
      locale: optionalText(input.locale) || 'fa-IR'
    },
    update: {
      displayName: optionalText(input.displayName),
      email: optionalEmail(input.email),
      locale: optionalText(input.locale) || 'fa-IR'
    }
  });
}

export async function updateCustomerProfile(customerId: string, input: CustomerProfileUpdateInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer profiles.');

  return prisma.customerProfile.update({
    where: { id: customerId },
    data: {
      displayName: optionalText(input.displayName),
      email: optionalEmail(input.email),
      locale: optionalText(input.locale) || 'fa-IR'
    }
  });
}

export async function updateAdminCustomerProfile(customerId: string, input: CustomerProfileUpdateInput) {
  const customer = await updateCustomerProfile(customerId, input);

  await recordAdminAuditLog({
    action: 'customer.profile.update',
    entity: 'customerProfile',
    entityId: customer.id,
    summary: `Updated customer profile: ${customer.phone}`,
    metadata: {
      displayNameUpdated: input.displayName !== undefined,
      emailUpdated: input.email !== undefined,
      locale: customer.locale
    }
  });

  return customer;
}

export async function addAdminCustomerTimelineNote(customerId: string, noteInput: string, actor: AdminIdentity) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer timeline notes.');

  const note = optionalText(noteInput);
  if (!note) throw new Error('Customer note is required.');
  if (note.length > 2000) throw new Error('Customer note must be 2000 characters or fewer.');

  const customer = await prisma.customerProfile.findUnique({
    where: { id: customerId },
    select: { id: true, phone: true }
  });
  if (!customer) throw new Error('Customer was not found.');

  const event = await prisma.customerAdminTimelineEvent.create({
    data: {
      customerId,
      type: 'staff_note',
      title: 'Staff note',
      note,
      actorType: actor.type,
      actorLabel: actor.label,
      actorEmail: actor.email,
      actorRole: actor.role,
      actorProvider: actor.provider
    }
  });

  await recordAdminAuditLog({
    action: 'customer.timeline.note.create',
    entity: 'customerProfile',
    entityId: customer.id,
    summary: `Added customer timeline note: ${customer.phone}`,
    metadata: {
      timelineEventId: event.id,
      type: event.type
    }
  });

  return event;
}

export async function addCustomerAddress(customerId: string, input: CustomerAddressInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer addresses.');
  if (!input.line1.trim()) throw new Error('Address line1 is required.');

  if (input.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId },
      data: { isDefault: false }
    });
  }

  return prisma.customerAddress.create({
    data: {
      customerId,
      label: optionalText(input.label) || 'Delivery address',
      recipient: optionalText(input.recipient),
      phone: input.phone ? normalizeCustomerPhone(input.phone) : undefined,
      city: optionalText(input.city),
      line1: input.line1.trim(),
      line2: optionalText(input.line2),
      notes: optionalText(input.notes),
      isDefault: Boolean(input.isDefault)
    }
  });
}

export async function updateCustomerAddress(customerId: string, addressId: string, input: CustomerAddressInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer addresses.');
  if (!input.line1.trim()) throw new Error('Address line1 is required.');

  const existing = await prisma.customerAddress.findFirst({ where: { id: addressId, customerId } });
  if (!existing) throw new Error('Address was not found.');

  if (input.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId, id: { not: addressId } },
      data: { isDefault: false }
    });
  }

  return prisma.customerAddress.update({
    where: { id: addressId },
    data: {
      label: optionalText(input.label) || 'Delivery address',
      recipient: optionalText(input.recipient),
      phone: input.phone ? normalizeCustomerPhone(input.phone) : undefined,
      city: optionalText(input.city),
      line1: input.line1.trim(),
      line2: optionalText(input.line2),
      notes: optionalText(input.notes),
      isDefault: Boolean(input.isDefault)
    }
  });
}

export async function setDefaultCustomerAddress(customerId: string, addressId: string) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer addresses.');

  const existing = await prisma.customerAddress.findFirst({ where: { id: addressId, customerId } });
  if (!existing) throw new Error('Address was not found.');

  await prisma.customerAddress.updateMany({ where: { customerId }, data: { isDefault: false } });
  return prisma.customerAddress.update({ where: { id: addressId }, data: { isDefault: true } });
}

export async function deleteCustomerAddress(customerId: string, addressId: string) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer addresses.');

  const existing = await prisma.customerAddress.findFirst({ where: { id: addressId, customerId } });
  if (!existing) throw new Error('Address was not found.');

  return prisma.customerAddress.delete({ where: { id: addressId } });
}

export async function listCustomerAddresses(customerId: string) {
  if (!hasDatabase()) return [];

  return prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }]
  });
}

export async function listAdminCustomers(): Promise<AdminCustomerListItem[]> {
  if (!hasDatabase()) return [];

  const customers = await prisma.customerProfile.findMany({
    include: {
      _count: { select: { accounts: true, addresses: true, orders: true } },
      accounts: { select: { lastLoginAt: true }, orderBy: { lastLoginAt: 'desc' }, take: 1 }
    },
    orderBy: { updatedAt: 'desc' },
    take: 100
  });

  return customers.map((customer) => ({
    id: customer.id,
    phone: customer.phone,
    displayName: customer.displayName,
    email: customer.email,
    locale: customer.locale,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    accountCount: customer._count.accounts,
    addressCount: customer._count.addresses,
    orderCount: customer._count.orders,
    lastLoginAt: customer.accounts[0]?.lastLoginAt
  }));
}

export async function getAdminCustomerDetail(customerId: string): Promise<AdminCustomerDetail | null> {
  if (!hasDatabase()) return null;

  const customer = await prisma.customerProfile.findUnique({
    where: { id: customerId },
    include: {
      _count: { select: { accounts: true, addresses: true, orders: true } },
      accounts: { orderBy: [{ lastLoginAt: 'desc' }, { createdAt: 'desc' }] },
      addresses: { orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] },
      timelineEvents: { orderBy: { createdAt: 'desc' }, take: 25 },
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: { select: { id: true } },
          paymentAttempts: { select: { status: true }, orderBy: { createdAt: 'desc' }, take: 1 }
        },
        take: 25
      }
    }
  });
  if (!customer) return null;

  const inquiryMatches = [
    { phone: customer.phone },
    ...(customer.email ? [{ email: customer.email }] : [])
  ];
  const inquiries = await prisma.customerInquiry.findMany({
    where: { OR: inquiryMatches },
    include: { product: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 25
  });

  return {
    id: customer.id,
    phone: customer.phone,
    displayName: customer.displayName,
    email: customer.email,
    locale: customer.locale,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    accountCount: customer._count.accounts,
    addressCount: customer._count.addresses,
    orderCount: customer._count.orders,
    lastLoginAt: customer.accounts[0]?.lastLoginAt,
    accounts: customer.accounts.map((account) => ({
      id: account.id,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      email: account.email,
      phone: account.phone,
      emailVerifiedAt: account.emailVerifiedAt,
      phoneVerifiedAt: account.phoneVerifiedAt,
      lastLoginAt: account.lastLoginAt,
      createdAt: account.createdAt
    })),
    addresses: customer.addresses.map((address) => ({
      id: address.id,
      label: address.label,
      recipient: address.recipient,
      phone: address.phone,
      city: address.city,
      line1: address.line1,
      line2: address.line2,
      notes: address.notes,
      isDefault: address.isDefault,
      updatedAt: address.updatedAt
    })),
    orders: customer.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      paymentStatus: order.paymentAttempts[0]?.status,
      totalCents: order.totalCents,
      currency: order.currency,
      itemCount: order.items.length,
      createdAt: order.createdAt
    })),
    inquiries: inquiries.map((inquiry) => ({
      id: inquiry.id,
      productTitle: inquiry.product?.title,
      status: inquiry.status,
      message: inquiry.message,
      deliveryDate: inquiry.deliveryDate,
      createdAt: inquiry.createdAt
    })),
    timelineEvents: customer.timelineEvents.map((event) => ({
      id: event.id,
      type: event.type,
      title: event.title,
      note: event.note,
      actorLabel: event.actorLabel,
      actorEmail: event.actorEmail,
      actorRole: event.actorRole,
      createdAt: event.createdAt
    }))
  };
}
