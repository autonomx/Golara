'use server';

import { redirect } from 'next/navigation';
import { clearCartTokenCookie, getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { claimCartForCheckout, completeCartCheckout, releaseCartCheckoutClaim } from '@/lib/cart/cart-repository';
import { checkoutActionNextPath } from '@/lib/checkout/checkout-action-next-path';
import { captureCustomerWalletCheckoutPayment } from '@/lib/checkout/customer-wallet-checkout-capture';
import { checkoutPaymentMethodMetadata, codSelectedMethodMetadata, resolveCheckoutPaymentMethodSelection } from '@/lib/checkout/payment-method-checkout-selection';
import { createOrderDraft } from '@/lib/checkout/order-draft-repository';
import { createCheckoutPaymentAttempt } from '@/lib/checkout/payment-provider';
import { addCustomerAddress, upsertCustomerProfile } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';
import { warnWithRedactedError } from '@/lib/security/redacted-logging';
import { paymentMethodSettingsService } from '@/lib/settings/payment-method-settings';

export type CartCheckoutActionState = {
  checkout: string | null;
};

function checkoutActionState(checkout: string): CartCheckoutActionState {
  return { checkout };
}

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function boundedStringField(formData: FormData, name: string, maxLength: number) {
  return stringField(formData, name).slice(0, maxLength);
}

function checkoutPath(status: string) {
  return `/cart/checkout?checkout=${encodeURIComponent(status)}`;
}

type DeliveryDateResult =
  | { ok: true; date?: Date }
  | { ok: false; checkout: string };

function optionalDeliveryDate(formData: FormData): DeliveryDateResult {
  const raw = stringField(formData, 'deliveryDate');
  if (!raw) return { ok: true };
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return { ok: false, checkout: 'delivery-date-invalid' };
  return { ok: true, date };
}

type DeliveryWindowResult =
  | { ok: true; deliveryWindow: string }
  | { ok: false; checkout: string };

function deliveryWindowField(formData: FormData): DeliveryWindowResult {
  const value = stringField(formData, 'deliveryWindow');
  if (!value) return { ok: true, deliveryWindow: '' };
  if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value)) return { ok: false, checkout: 'delivery-window-invalid' };
  return { ok: true, deliveryWindow: value };
}

function manualTransferMetadata(formData: FormData, methodType: string) {
  if (methodType !== 'manual_transfer') return {};
  const manualPaymentReference = boundedStringField(formData, 'manualPaymentReference', 120);
  const manualPaymentProofUrl = boundedStringField(formData, 'manualPaymentProofUrl', 240);
  return {
    ...(manualPaymentReference ? { manualPaymentReference } : {}),
    ...(manualPaymentProofUrl ? { manualPaymentProofUrl } : {}),
    manualPaymentInstructionsAcknowledged: true
  };
}

function installmentRequestMetadata(formData: FormData, methodType: string) {
  if (methodType !== 'installment') return {};
  const requestedTerm = stringField(formData, 'installmentRequestedTermMonths');
  const installmentRequestNote = boundedStringField(formData, 'installmentRequestNote', 320);
  const allowedTerms = new Set(['3', '6', '12', '18']);
  const installmentRequestedTermMonths = allowedTerms.has(requestedTerm) ? Number.parseInt(requestedTerm, 10) : 0;
  return {
    installmentRequestAcknowledged: true,
    installmentApprovalStatus: 'pending_review',
    ...(installmentRequestedTermMonths ? { installmentRequestedTermMonths } : {}),
    ...(installmentRequestNote ? { installmentRequestNote } : {})
  };
}

export async function createCartCheckoutAction(
  _previousState: CartCheckoutActionState,
  formData: FormData
): Promise<CartCheckoutActionState> {
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
  const paymentMethodKey = stringField(formData, 'paymentMethodKey');
  const deliveryDateResult = optionalDeliveryDate(formData);
  const deliveryWindowResult = deliveryWindowField(formData);

  if (!deliveryDateResult.ok) return checkoutActionState(deliveryDateResult.checkout);
  if (!deliveryWindowResult.ok) return checkoutActionState(deliveryWindowResult.checkout);
  if (name.length < 2) return checkoutActionState('name-required');
  if (phone.length < 7) return checkoutActionState('phone-required');
  if (city.length < 2) return checkoutActionState('city-required');
  if (line1.length < 4) return checkoutActionState('address-required');

  const paymentMethodSelection = resolveCheckoutPaymentMethodSelection(await paymentMethodSettingsService.list(), paymentMethodKey);
  if (!paymentMethodSelection.ok) return checkoutActionState(paymentMethodSelection.code);

  const deliveryDate = deliveryDateResult.date;
  const deliveryWindow = deliveryWindowResult.deliveryWindow;
  let redirectTarget = '';
  let claimAcquired = false;
  let checkoutCompleted = false;
  let formState: CartCheckoutActionState | null = null;

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

      const attempt = await createCheckoutPaymentAttempt({
        orderId: order.id,
        provider: paymentMethodSelection.selection.provider,
        metadata: {
          ...checkoutPaymentMethodMetadata(paymentMethodSelection.selection),
          ...codSelectedMethodMetadata(paymentMethodSelection.selection),
          ...manualTransferMetadata(formData, paymentMethodSelection.selection.methodType),
          ...installmentRequestMetadata(formData, paymentMethodSelection.selection.methodType)
        }
      });
      let paymentAttemptForRedirect = attempt;
      if (paymentMethodSelection.selection.methodType === 'wallet') {
        await captureCustomerWalletCheckoutPayment({
          paymentAttemptId: attempt.id,
          actorLabel: 'Wallet checkout',
          actorRole: 'system',
          note: 'Wallet balance captured during checkout.'
        });
        paymentAttemptForRedirect = { ...attempt, status: 'paid' };
      }
      await completeCartCheckout(token);
      await clearCartTokenCookie();
      checkoutCompleted = true;
      redirectTarget = checkoutActionNextPath(order, paymentAttemptForRedirect);
    }
  } catch (error) {
    warnWithRedactedError('cart', 'failed to create checkout order', error);
    formState = checkoutActionState('failed');
  }

  if (claimAcquired && !checkoutCompleted) {
    await releaseCartCheckoutClaim(token);
  }

  if (formState) return formState;
  redirect(redirectTarget);
}