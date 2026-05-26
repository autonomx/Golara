import 'server-only';

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

export async function upsertCustomerProfile(input: CustomerProfileInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer profiles.');

  const phone = normalizeCustomerPhone(input.phone);
  return prisma.customerProfile.upsert({
    where: { phone },
    create: {
      phone,
      displayName: optionalText(input.displayName),
      email: optionalText(input.email),
      locale: optionalText(input.locale) || 'fa-IR'
    },
    update: {
      displayName: optionalText(input.displayName),
      email: optionalText(input.email),
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
      email: optionalText(input.email),
      locale: optionalText(input.locale) || 'fa-IR'
    }
  });
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
