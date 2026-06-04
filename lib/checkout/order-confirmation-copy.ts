export type OrderConfirmationTone = 'success' | 'warning' | 'info';

export type OrderConfirmationResultCopy = {
  eyebrow: string;
  title: string;
  body: string;
  tone: OrderConfirmationTone;
};

const defaultCopy: OrderConfirmationResultCopy = {
  eyebrow: 'Order draft created',
  title: 'Thank you',
  body: 'Your order draft has been sent to the shop. Staff will review availability and follow up with the next step.',
  tone: 'info'
};

const resultCopy: Record<string, OrderConfirmationResultCopy> = {
  paid: {
    eyebrow: 'Payment verified',
    title: 'Payment received',
    body: 'Thank you. Your payment result was accepted and the shop can continue preparing your order.',
    tone: 'success'
  },
  failed: {
    eyebrow: 'Payment needs review',
    title: 'Payment was not verified',
    body: 'The shop still has your order draft. The order is not marked paid unless the gateway confirms it.',
    tone: 'warning'
  },
  cancelled: {
    eyebrow: 'Payment cancelled',
    title: 'Checkout was cancelled',
    body: 'Your order draft remains available for staff follow-up if you still want to continue.',
    tone: 'warning'
  },
  'missing-token': {
    eyebrow: 'Order lookup unavailable',
    title: 'We could not open the order status page',
    body: 'The return link did not include a usable public order token. Keep your order reference and contact the shop for help.',
    tone: 'warning'
  }
};

export function orderConfirmationResultCopy(result?: string | null): OrderConfirmationResultCopy {
  const normalized = result?.trim().toLowerCase();
  if (!normalized) return defaultCopy;
  return resultCopy[normalized] ?? defaultCopy;
}

export function orderConfirmationPanelClass(tone: OrderConfirmationTone) {
  if (tone === 'success') return 'border-olive/20 bg-cream text-olive';
  if (tone === 'warning') return 'border-amber-300 bg-amber-50 text-amber-900';
  return 'border-rosewood/10 bg-white text-stone-700';
}
