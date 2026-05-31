import { NextResponse } from 'next/server';
import {
  checkoutReturnApplyInput,
  checkoutReturnFallbackUrl,
  checkoutReturnSuccessUrl
} from '@/lib/checkout/order-return-route-core';
import { applyCheckoutResult } from '@/lib/checkout/payment-result-handler';

export async function GET(request: Request) {
  try {
    const result = await applyCheckoutResult(checkoutReturnApplyInput(request.url));
    return NextResponse.redirect(checkoutReturnSuccessUrl(request.url, result));
  } catch (error) {
    console.warn('[orders] failed to apply return status', error);
    return NextResponse.redirect(checkoutReturnFallbackUrl(request.url));
  }
}
