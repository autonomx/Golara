export const CHECKOUT_ORDER_STATUSES = ['draft', 'pending', 'confirmed', 'cancelled', 'completed'] as const;
export const CHECKOUT_PAYMENT_STATUSES = ['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'] as const;
export const CHECKOUT_FULFILLMENT_STATUSES = ['not_scheduled', 'scheduled', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as const;

export type CheckoutOrderStatus = typeof CHECKOUT_ORDER_STATUSES[number];
export type CheckoutPaymentStatus = typeof CHECKOUT_PAYMENT_STATUSES[number];
export type CheckoutFulfillmentStatus = typeof CHECKOUT_FULFILLMENT_STATUSES[number];

const ORDER_TRANSITIONS: Record<CheckoutOrderStatus, CheckoutOrderStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: []
};

const PAYMENT_TRANSITIONS: Record<CheckoutPaymentStatus, CheckoutPaymentStatus[]> = {
  created: ['pending', 'paid', 'failed', 'cancelled'],
  pending: ['paid', 'failed', 'cancelled'],
  paid: ['refunded'],
  failed: ['pending', 'cancelled'],
  cancelled: [],
  refunded: []
};

const FULFILLMENT_TRANSITIONS: Record<CheckoutFulfillmentStatus, CheckoutFulfillmentStatus[]> = {
  not_scheduled: ['scheduled', 'cancelled'],
  scheduled: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

function includes<T extends string>(values: readonly T[], value: string): value is T {
  return values.includes(value as T);
}

function transitionResult<T extends string>(from: T, to: T, allowed: readonly T[]) {
  if (from === to) return { ok: true as const };
  if (allowed.includes(to)) return { ok: true as const };
  return {
    ok: false as const,
    reason: `Illegal transition from ${from} to ${to}.`,
    allowedTransitions: [...allowed]
  };
}

export function isCheckoutOrderStatus(value: string): value is CheckoutOrderStatus {
  return includes(CHECKOUT_ORDER_STATUSES, value);
}

export function isCheckoutPaymentStatus(value: string): value is CheckoutPaymentStatus {
  return includes(CHECKOUT_PAYMENT_STATUSES, value);
}

export function isCheckoutFulfillmentStatus(value: string): value is CheckoutFulfillmentStatus {
  return includes(CHECKOUT_FULFILLMENT_STATUSES, value);
}

export function assertCheckoutOrderStatus(value: string): CheckoutOrderStatus {
  if (isCheckoutOrderStatus(value)) return value;
  throw new Error(`Unknown checkout order status: ${value}`);
}

export function assertCheckoutPaymentStatus(value: string): CheckoutPaymentStatus {
  if (isCheckoutPaymentStatus(value)) return value;
  throw new Error(`Unknown checkout payment status: ${value}`);
}

export function assertCheckoutFulfillmentStatus(value: string): CheckoutFulfillmentStatus {
  if (isCheckoutFulfillmentStatus(value)) return value;
  throw new Error(`Unknown checkout fulfillment status: ${value}`);
}

export function canTransitionCheckoutOrderStatus(from: CheckoutOrderStatus, to: CheckoutOrderStatus) {
  return transitionResult(from, to, ORDER_TRANSITIONS[from]);
}

export function canTransitionCheckoutPaymentStatus(from: CheckoutPaymentStatus, to: CheckoutPaymentStatus) {
  return transitionResult(from, to, PAYMENT_TRANSITIONS[from]);
}

export function canTransitionCheckoutFulfillmentStatus(from: CheckoutFulfillmentStatus, to: CheckoutFulfillmentStatus) {
  return transitionResult(from, to, FULFILLMENT_TRANSITIONS[from]);
}

export function getAllowedCheckoutOrderTransitions(from: CheckoutOrderStatus) {
  return [...ORDER_TRANSITIONS[from]];
}

export function getAllowedCheckoutPaymentTransitions(from: CheckoutPaymentStatus) {
  return [...PAYMENT_TRANSITIONS[from]];
}

export function getAllowedCheckoutFulfillmentTransitions(from: CheckoutFulfillmentStatus) {
  return [...FULFILLMENT_TRANSITIONS[from]];
}
