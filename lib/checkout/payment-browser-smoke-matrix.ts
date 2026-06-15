export type PaymentBrowserSmokeArea =
  | 'cart'
  | 'checkout'
  | 'provider_handoff'
  | 'payment_return'
  | 'public_order'
  | 'localization'
  | 'account_context';

export type PaymentBrowserSmokeCase = {
  id: string;
  area: PaymentBrowserSmokeArea;
  title: string;
  route: string;
  requiredForGatewayLaunch: boolean;
  evidence: string[];
};

export const paymentBrowserSmokeMatrix: PaymentBrowserSmokeCase[] = [
  {
    id: 'cart-guest-add-update-remove',
    area: 'cart',
    title: 'Guest cart supports add, update, remove, clear, subtotal, and count badge behavior.',
    route: '/cart',
    requiredForGatewayLaunch: true,
    evidence: ['desktop screenshot', 'mobile screenshot', 'cart token cookie check', 'subtotal check']
  },
  {
    id: 'checkout-guest-order-summary',
    area: 'checkout',
    title: 'Guest cart checkout renders contact, delivery, and order-summary fields without stale totals.',
    route: '/cart/checkout',
    requiredForGatewayLaunch: true,
    evidence: ['order summary screenshot', 'validation error screenshot', 'server recomputed total note']
  },
  {
    id: 'checkout-signed-in-prefill',
    area: 'checkout',
    title: 'Signed-in checkout pre-fills saved profile/default address without exposing another customer\'s data.',
    route: '/cart/checkout',
    requiredForGatewayLaunch: true,
    evidence: ['signed-in session note', 'prefill screenshot', 'ownership boundary check']
  },
  {
    id: 'provider-handoff-idempotency',
    area: 'provider_handoff',
    title: 'Provider handoff creates one payment attempt/session for repeated checkout submissions.',
    route: '/cart/checkout',
    requiredForGatewayLaunch: true,
    evidence: ['provider session id', 'payment attempt id', 'duplicate submission result']
  },
  {
    id: 'return-success-public-order',
    area: 'payment_return',
    title: 'Provider success return lands on safe customer-facing confirmation and public order status.',
    route: '/orders/return',
    requiredForGatewayLaunch: true,
    evidence: ['success return URL', 'public order URL', 'safe paid banner screenshot']
  },
  {
    id: 'return-cancel-failure',
    area: 'payment_return',
    title: 'Provider cancel, failed, missing-token, and unverified return states remain safe and do not mark paid.',
    route: '/orders/return',
    requiredForGatewayLaunch: true,
    evidence: ['cancel screenshot', 'failed screenshot', 'missing token screenshot', 'order status check']
  },
  {
    id: 'public-order-privacy',
    area: 'public_order',
    title: 'Public order page shows customer-safe payment/order status without internal provider details.',
    route: '/orders/[token]',
    requiredForGatewayLaunch: true,
    evidence: ['public order screenshot', 'provider metadata absence check', 'timeline privacy check']
  },
  {
    id: 'localization-en-fa-payment-copy',
    area: 'localization',
    title: 'English and Persian checkout/payment/order pages render the correct language and text direction.',
    route: '/cart/checkout',
    requiredForGatewayLaunch: true,
    evidence: ['English LTR screenshot', 'Persian RTL screenshot', 'mixed-language absence check']
  },
  {
    id: 'account-context-order-history',
    area: 'account_context',
    title: 'Signed-in customer can see only their own order history after payment result handling.',
    route: '/account/orders',
    requiredForGatewayLaunch: true,
    evidence: ['own order history screenshot', 'cross-customer denial note', 'session boundary check']
  }
];

export function getRequiredPaymentBrowserSmokeCases() {
  return paymentBrowserSmokeMatrix.filter((testCase) => testCase.requiredForGatewayLaunch);
}

export function summarizePaymentBrowserSmokeReadiness(completedCaseIds: Iterable<string>) {
  const completed = new Set(completedCaseIds);
  const required = getRequiredPaymentBrowserSmokeCases();
  const missing = required.filter((testCase) => !completed.has(testCase.id));

  return {
    requiredCount: required.length,
    completedCount: required.length - missing.length,
    missing,
    ready: missing.length === 0
  };
}
