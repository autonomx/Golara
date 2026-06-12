import { NextResponse } from 'next/server';
import { checkoutReturnRouteRedirect } from '@/lib/checkout/order-return-route-handler-core';
import { applyCheckoutResult } from '@/lib/checkout/payment-result-handler';
import { warnWithRedactedError } from '@/lib/security/redacted-logging';

export async function GET(request: Request) {
  const result = await checkoutReturnRouteRedirect({
    requestUrl: request.url,
    applyResult: applyCheckoutResult
  });
  if (!result.applied) warnWithRedactedError('orders', 'failed to apply return status', result.error);
  return NextResponse.redirect(result.redirectUrl);
}
