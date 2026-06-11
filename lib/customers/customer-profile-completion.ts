export type CustomerProfileCompletionCustomer = {
  displayName?: string | null;
};

export function isCustomerProfileComplete(customer: CustomerProfileCompletionCustomer) {
  return Boolean(customer.displayName?.trim());
}

export function safeCustomerProfileReturnTo(value?: string | null, fallback = '/account') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.startsWith('/account/login')) return fallback;
  return value;
}

export function customerProfileCompletionPath(returnTo?: string | null) {
  const safeReturnTo = safeCustomerProfileReturnTo(returnTo);
  const params = new URLSearchParams({ status: 'complete-profile', returnTo: safeReturnTo });
  return `/account/profile?${params.toString()}`;
}
