import { NextResponse } from 'next/server';
import { applyCheckoutResult } from '@/lib/checkout/payment-result-handler';

function fallback(request: Request, status = 'failed') {
  const url = new URL('/orders/confirmation', request.url);
  url.searchParams.set('result', status);
  return url;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get('order') || '';
  const token = url.searchParams.get('token') || '';
  const status = url.searchParams.get('status') || 'failed';
  const providerReference = url.searchParams.get('ref') || undefined;

  try {
    const result = await applyCheckoutResult({ orderNumber, token, status, providerReference });
    if (!result.publicLookupToken) return NextResponse.redirect(fallback(request, 'missing-token'));

    const nextUrl = new URL(`/orders/${result.publicLookupToken}`, request.url);
    nextUrl.searchParams.set('result', result.status);
    return NextResponse.redirect(nextUrl);
  } catch (error) {
    console.warn('[orders] failed to apply return status', error);
    return NextResponse.redirect(fallback(request));
  }
}
