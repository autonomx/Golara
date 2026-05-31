export type OrderNextPathAttempt = {
  status: string;
  nextUrl?: string | null;
};

export type OrderNextPathInput = {
  orderNumber: string;
  publicLookupToken?: string | null;
  attempt: OrderNextPathAttempt;
};

export function orderNextPath(input: OrderNextPathInput) {
  const nextUrl = input.attempt.nextUrl?.trim();
  if (input.attempt.status === 'redirect_required' && nextUrl) {
    return nextUrl;
  }
  if (!input.publicLookupToken) {
    return `/orders/confirmation?order=${encodeURIComponent(input.orderNumber)}`;
  }
  return `/orders/${input.publicLookupToken}`;
}
