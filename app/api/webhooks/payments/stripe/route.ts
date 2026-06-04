import { NextResponse } from 'next/server';

import { handlePaymentWebhookRoute } from '@/lib/checkout/payment-webhook-route-core';
import { paymentWebhookService } from '@/lib/checkout/payment-webhook-service';

export async function POST(request: Request) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const result = await handlePaymentWebhookRoute({
    provider: 'stripe',
    payload,
    headers: Object.fromEntries(request.headers.entries()),
    record: paymentWebhookService.record
  });

  return NextResponse.json(result.body, { status: result.statusCode });
}
