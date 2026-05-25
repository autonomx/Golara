import { NextResponse } from 'next/server';
import { applyCheckoutResult } from '@/lib/checkout/payment-result-handler';

function fallback(request: Request, status = 'failed') {
  const url = new URL('/orders/confirmation', request.url);
  url.searchParams.set('result', status);
  return url;
}

function zarinpalStatus(status: string | null) {
  const normalized = status?.trim().toLowerCase();
  if (normalized === 'ok') return 'paid';
  if (normalized === 'nok') return 'failed';
  return status || 'failed';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || undefined;
  const orderNumber = url.searchParams.get('order') || '';
  const token = url.searchParams.get('token') || '';
  const authority = url.searchParams.get('Authority') || url.searchParams.get('authority') || undefined;
  const rawStatus = url.searchParams.get('Status') || url.searchParams.get('status');
  const status = provider === 'zarinpal' ? zarinpalStatus(rawStatus) : rawStatus || 'failed';
  const providerReference = url.searchParams.get('ref') || authority || undefined;

  try {
    const result = await applyCheckoutResult({ orderNumber, token, status, provider, providerReference, authority });
    if (!result.publicLookupToken) return NextResponse.redirect(fallback(request, 'missing-token'));

    const nextUrl = new URL(`/orders/${result.publicLookupToken}`, request.url);
    nextUrl.searchParams.set('result', result.status);
    return NextResponse.redirect(nextUrl);
  } catch (error) {
    console.warn('[orders] failed to apply return status', error);
    return NextResponse.redirect(fallback(request));
  }
}
