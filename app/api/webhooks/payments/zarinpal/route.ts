import { NextResponse } from 'next/server';

import { handlePaymentWebhookRoute } from '@/lib/checkout/payment-webhook-route-core';
import { paymentWebhookService } from '@/lib/checkout/payment-webhook-service';
import { verifyPaymentWebhookSignature } from '@/lib/checkout/payment-webhook-signature';

export async function POST(request: Request) {
  const headers = Object.fromEntries(request.headers.entries());
  const rawBody = await request.text();
  const signature = verifyPaymentWebhookSignature({
    provider: 'zarinpal',
    rawBody,
    headers
  });

  if (!signature.ok) {
    return NextResponse.json({
      ok: false,
      provider: 'zarinpal',
      status: 'invalid_signature',
      reason: signature.reason
    }, { status: signature.enforced ? 401 : 202 });
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    payload = null;
  }

  const result = await handlePaymentWebhookRoute({
    provider: 'zarinpal',
    payload,
    eventType: 'zarinpal.payment',
    headers,
    record: paymentWebhookService.record
  });

  return NextResponse.json(result.body, { status: result.statusCode });
}
