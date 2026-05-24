'use server';

import { redirect } from 'next/navigation';
import { createOrderDraft } from '@/lib/checkout/order-draft-repository';
import { createCheckoutPaymentAttempt } from '@/lib/checkout/payment-provider';
import { addCustomerAddress, upsertCustomerProfile } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function intField(formData: FormData, name: string, fallback = 1) {
  const value = Number.parseInt(stringField(formData, name, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
}

function checkoutPath(productSlug: string, status: string) {
  return `/products/${productSlug}?checkout=${encodeURIComponent(status)}`;
}

export async function createCheckoutAction(productId: string | undefined, productSlug: string, formData: FormData) {
  if (!hasDatabase() || !productId) {
    redirect(checkoutPath(productSlug, 'database-required'));
  }

  try {
    const name = stringField(formData, 'name');
    const phone = stringField(formData, 'phone');
    const email = stringField(formData, 'email');
    const line1 = stringField(formData, 'addressLine1');
    const quantity = intField(formData, 'quantity', 1);

    if (name.length < 2) redirect(checkoutPath(productSlug, 'name-required'));
    if (line1.length < 4) redirect(checkoutPath(productSlug, 'address-required'));

    const customer = await upsertCustomerProfile({
      phone,
      displayName: name,
      email,
      locale: 'fa-IR'
    });
    const address = await addCustomerAddress(customer.id, {
      label: 'Checkout delivery address',
      recipient: name,
      phone,
      city: stringField(formData, 'city'),
      line1,
      line2: stringField(formData, 'addressLine2'),
      notes: stringField(formData, 'deliveryNotes'),
      isDefault: true
    });
    const order = await createOrderDraft({
      customerId: customer.id,
      addressId: address.id,
      checkoutMode: process.env.CHECKOUT_MODE || 'assisted',
      currency: process.env.CHECKOUT_DOMESTIC_CURRENCY || 'TOMAN',
      deliveryDate: stringField(formData, 'deliveryDate') ? new Date(stringField(formData, 'deliveryDate')) : undefined,
      deliveryWindow: stringField(formData, 'deliveryWindow'),
      recipientName: name,
      recipientPhone: phone,
      customerNote: stringField(formData, 'customerNote'),
      items: [{ productId, quantity }]
    });

    await createCheckoutPaymentAttempt({ orderId: order.id });
    redirect(`/admin/orders/${order.id}`);
  } catch (error) {
    console.warn('[checkout] failed to create order draft', error);
    redirect(checkoutPath(productSlug, 'failed'));
  }
}
