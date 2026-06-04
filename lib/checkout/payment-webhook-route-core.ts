import type { PaymentWebhookEventInput } from './payment-webhook-core';
import type { PaymentWebhookServiceResult } from './payment-webhook-service';

export type PaymentWebhookRouteProvider = 'stripe' | 'zarinpal';

export type PaymentWebhookRouteResult = {
  statusCode: number;
  body: {
    ok: boolean;
    provider: PaymentWebhookRouteProvider;
    status: 'recorded' | 'duplicate' | 'needs_attention' | 'invalid' | 'error';
    idempotencyKey?: string;
    paymentAttemptId?: string;
    paymentEventId?: string;
    message?: string;
  };
};

export type PaymentWebhookRouteInput = {
  provider: PaymentWebhookRouteProvider;
  payload: Record<string, unknown> | null;
  eventType?: string;
  headers?: Record<string, string | string[] | undefined>;
  record: (input: PaymentWebhookEventInput) => Promise<PaymentWebhookServiceResult>;
};

function webhookEventType(input: PaymentWebhookRouteInput) {
  if (input.eventType?.trim()) return input.eventType.trim();
  if (input.provider === 'stripe' && typeof input.payload?.type === 'string') return input.payload.type;
  if (input.provider === 'zarinpal') return 'zarinpal.payment';
  return `${input.provider}.payment`;
}

export async function handlePaymentWebhookRoute(input: PaymentWebhookRouteInput): Promise<PaymentWebhookRouteResult> {
  if (!input.payload || typeof input.payload !== 'object' || Array.isArray(input.payload)) {
    return {
      statusCode: 400,
      body: {
        ok: false,
        provider: input.provider,
        status: 'invalid',
        message: 'Webhook payload must be a JSON object.'
      }
    };
  }

  try {
    const result = await input.record({
      provider: input.provider,
      eventType: webhookEventType(input),
      payload: input.payload,
      headers: input.headers
    });

    return {
      statusCode: result.status === 'needs_attention' ? 202 : 200,
      body: {
        ok: result.status !== 'needs_attention',
        provider: input.provider,
        status: result.status,
        idempotencyKey: result.idempotencyKey,
        paymentAttemptId: result.paymentAttemptId,
        paymentEventId: result.paymentEventId,
        message: result.status === 'needs_attention' ? 'Webhook was recorded for operator attention or could not be matched yet.' : undefined
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        ok: false,
        provider: input.provider,
        status: 'error',
        message: error instanceof Error ? error.message : 'Webhook handling failed.'
      }
    };
  }
}
