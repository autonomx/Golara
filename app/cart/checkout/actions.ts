'use server';

import { redirect } from 'next/navigation';
import { clearCartTokenCookie, getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { clearCart, getCartByToken } from '@/lib/cart/cart-repository';
import { createOrderDraft } from '@/lib/checkout/order-draft-repository';
import { createCheckoutPaymentAttempt } from '@/lib/checkout/payment-provider';
import { addCustomerAddress, upsertCustomerProfile } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function checkoutPath(status: string) {
  return `/cart/checkout?checkout=${encodeURIComponent(status)}`;
}

export async function createCartCheckoutAction(formData: FormData) {
  if (!hasDatabase()) redirect(checkoutPath('database-required'));

  const token = await getCartTokenCookie();
  if (!token) redirect(checkoutPath('cart-missing'));

  let redirectTarget = '';
  let shouldClearCart = false;

  try {
    const cart = await getCartByToken(token);
    const items = cart?.items ?? [];
    const name = stringField(formData, 'name');
    const phone = stringField(formData, 'phone');
    const email = stringField(formData, 'email');
    const line1 = stringField(formData, 'addressLine1');

    if (items.length === 0) {
      redirectTarget = checkoutPath('cart-empty');
    } else if (name.length < 2) {
      redirectTarget = checkoutPath('name-required');
    } else if (line1.length < 4) {
      redirectTarget = checkoutPath('address-required');
    } else {
      const customer = await upsertCustomerProfile({
        phone,
        displayName: name,
        email,
        locale: cart?.locale || 'fa-IR'
      });
      const address = await addCustomerAddress(customer.id, {
        label: 'Cart checkout delivery address',
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
        checkoutMode: process.env.CHECKOUT_MODE || 'cart',
        currency: cart?.currency || process.env.CHECKOUT_DOMESTIC_CURRENCY || 'TOMAN',
        deliveryDate: stringField(formData, 'deliveryDate') ? new Date(stringField(formData, 'deliveryDate')) : undefined,
        deliveryWindow: stringField(formData, 'deliveryWindow'),
        recipientName: name,
        recipientPhone: phone,
        customerNote: stringField(formData, 'customerNote'),
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      });

      const attempt = await createCheckoutPaymentAttempt({ orderId: order.id });
      shouldClearCart = true;
      if (attempt.redirectUrl && attempt.status === 'redirect_required') {
        redirectTarget = attempt.redirectUrl;
      } else if (!order.publicLookupToken) {
        redirectTarget = `/orders/confirmation?order=${encodeURIComponent(order.orderNumber)}`;
      } else {
        redirectTarget = `/orders/${order.publicLookupToken}`;
      }
    }
  } catch (error) {
    console.warn('[cart] failed to create checkout order', error);
    redirectTarget = checkoutPath('failed');
  }

  if (shouldClearCart && token) {
    await clearCart(token);
    await clearCartTokenCookie();
  }

  redirect(redirectTarget);
}
