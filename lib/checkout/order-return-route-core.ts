export type CheckoutReturnApplyInput = {
  orderNumber: string;
  token: string;
  status: string;
  provider?: string;
  providerReference?: string;
  authority?: string;
};

export type CheckoutReturnResult = {
  publicLookupToken?: string | null;
  status: string;
};

export function checkoutReturnFallbackUrl(requestUrl: string, status = 'failed') {
  const url = new URL('/orders/confirmation', requestUrl);
  url.searchParams.set('result', status);
  return url;
}

export function normalizeZarinpalReturnStatus(status: string | null) {
  const normalized = status?.trim().toLowerCase();
  if (normalized === 'ok') return 'paid';
  if (normalized === 'nok') return 'failed';
  return status || 'failed';
}

export function normalizeHostedCheckoutReturnStatus(status: string | null) {
  const normalized = status?.trim().toLowerCase();
  if (normalized === 'success') return 'paid';
  if (normalized === 'cancel') return 'cancelled';
  return status || 'failed';
}

export function checkoutReturnApplyInput(requestUrl: string): CheckoutReturnApplyInput {
  const url = new URL(requestUrl);
  const provider = url.searchParams.get('provider') || undefined;
  const orderNumber = url.searchParams.get('order') || '';
  const token = url.searchParams.get('token') || '';
  const authority = url.searchParams.get('Authority') || url.searchParams.get('authority') || undefined;
  const hostedCheckoutReference = url.searchParams.get('checkout_session_id') || url.searchParams.get('checkoutSession') || undefined;
  const rawStatus = url.searchParams.get('Status') || url.searchParams.get('status');
  const paymentStatus = url.searchParams.get('payment');
  const status = provider === 'zarinpal'
    ? normalizeZarinpalReturnStatus(rawStatus)
    : normalizeHostedCheckoutReturnStatus(rawStatus || paymentStatus);
  const providerReference = url.searchParams.get('ref') || hostedCheckoutReference || authority || undefined;

  return { orderNumber, token, status, provider, providerReference, authority };
}

export function checkoutReturnSuccessUrl(requestUrl: string, result: CheckoutReturnResult) {
  if (!result.publicLookupToken) return checkoutReturnFallbackUrl(requestUrl, 'missing-token');
  const nextUrl = new URL(`/orders/${result.publicLookupToken}`, requestUrl);
  nextUrl.searchParams.set('result', result.status);
  return nextUrl;
}
