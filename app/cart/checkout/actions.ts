'use server';

import { redirect } from 'next/navigation';
import { clearCartTokenCookie, getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { claimCartForCheckout, completeCartCheckout, releaseCartCheckoutClaim } from '@/lib/cart/cart-repository';
import { checkoutActionNextPath } from '@/lib/checkout/checkout-action-next-path';
import { createOrderDraft } from '@/lib/checkout/order-draft-repository';
import { createCheckoutPaymentAttempt } from '@/lib/checkout/payment-provider';
import { addCustomerAddress, upsertCustomerProfile } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';
import { warnWithRedactedError } from '@/lib/security/redacted-logging';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function checkoutPath(status: string) {
  return `/cart/checkout?checkout=${encodeURIComponent(status)}`;
}

function optionalDeliveryDate(formData: FormData) {
  const raw = stringField(formData, 'deliveryDate');
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) redirect(checkoutPath('delivery-date-invalid'));
  return date;
}

function deliveryWindowField(formData: FormData) {
  const value = stringField(formData, 'deliveryWindow');
  if (!value) return '';
  if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value)) redirect(checkoutPath('delivery-window-invalid'));
  return value;
}

export async function createCartCheckoutAction(formData: FormData) {
  // Enforce same-origin policy for checkout to prevent CSRF attacks
  await assertSameOriginServerAction();
  if (!hasDatabase()) redirect(checkoutPath('database-required'));

  const token = await getCartTokenCookie();
  if (!token) redirect(checkoutPath('cart-missing'));

  const name = stringField(formData, 'name');
  const phone = stringField(formData, 'phone');
  const email = stringField(formData, 'email');
  const city = stringField(formData, 'city');
  const line1 = stringField(formData, 'addressLine1');
  const deliveryDate = optionalDeliveryDate(formData);
  const deliveryWindow = deliveryWindowField(formData);

  if (name.length < 2) redirect(checkoutPath('name-required'));
  if (phone.length < 7) redirect(checkoutPath('phone-required'));
  if (city.length < 2) redirect(checkoutPath('city-required'));
  if (line1.length < 4) redirect(checkoutPath('address-required'));

  let redirectTarget = '';
  let claimAcquired = false;
  let checkoutCompleted = false;

  try {
    const cart = await claimCartForCheckout(token);
    claimAcquired = Boolean(cart);
    const items = cart?.items ?? [];

    if (items.length === 0) {
      redirectTarget = checkoutPath(claimAcquired ? 'cart-empty' : 'cart-processing');
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
        city,
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
        deliveryDate,
        deliveryWindow,
        recipientName: name,
        recipientPhone: phone,
        customerNote: stringField(formData, 'customerNote'),
        items: items.map((item) => ({ productId: item.productId, variantId: item.variantId ?? undefined, quantity: item.quantity }))
      });

      const attempt = await createCheckoutPaymentAttempt({ orderId: order.id });
      await completeCartCheckout(token);
      await clearCartTokenCookie();
      checkoutCompleted = true;
      redirectTarget = checkoutActionNextPath(order, attempt);
    }
  } catch (error) {
    warnWithRedactedError('cart', 'failed to create checkout order', error);
    redirectTarget = checkoutPath('failed');
  }

  if (claimAcquired && !checkoutCompleted) {
    await releaseCartCheckoutClaim(token);
  }

  redirect(redirectTarget);
}
