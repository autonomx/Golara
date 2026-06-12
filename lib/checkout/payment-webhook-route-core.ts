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

export const MAX_PAYMENT_WEBHOOK_BODY_BYTES = 64 * 1024;

function webhookEventType(input: PaymentWebhookRouteInput) {
  if (input.eventType?.trim()) return input.eventType.trim();
  if (input.provider === 'stripe' && typeof input.payload?.type === 'string') return input.payload.type;
  if (input.provider === 'zarinpal') return 'zarinpal.payment';
  return `${input.provider}.payment`;
}

function webhookResultStatusCode(status: PaymentWebhookServiceResult['status']) {
  if (status === 'needs_attention') return 202;
  if (status === 'duplicate') return 409;
  return 200;
}

function webhookResultOk(status: PaymentWebhookServiceResult['status']) {
  return status === 'recorded';
}

function webhookResultMessage(status: PaymentWebhookServiceResult['status']) {
  if (status === 'needs_attention') return 'Webhook was recorded for operator attention or could not be matched yet.';
  if (status === 'duplicate') return 'Duplicate webhook replay was rejected by idempotency key.';
  return undefined;
}

export function validatePaymentWebhookRawBody(input: {
  provider: PaymentWebhookRouteProvider;
  rawBody: string;
  headers?: Record<string, string | string[] | undefined>;
}): PaymentWebhookRouteResult | null {
  const contentLength = input.headers?.['content-length'];
  const contentLengthValue = Array.isArray(contentLength) ? contentLength[0] : contentLength;
  const declaredBytes = contentLengthValue ? Number.parseInt(contentLengthValue, 10) : undefined;
  const bodyBytes = new TextEncoder().encode(input.rawBody).length;

  if ((Number.isFinite(declaredBytes) && declaredBytes! > MAX_PAYMENT_WEBHOOK_BODY_BYTES) || bodyBytes > MAX_PAYMENT_WEBHOOK_BODY_BYTES) {
    return {
      statusCode: 413,
      body: {
        ok: false,
        provider: input.provider,
        status: 'invalid',
        message: 'Webhook payload exceeds the maximum allowed size.'
      }
    };
  }

  if (!input.rawBody.trim()) {
    return {
      statusCode: 400,
      body: {
        ok: false,
        provider: input.provider,
        status: 'invalid',
        message: 'Webhook payload must be a non-empty JSON object.'
      }
    };
  }

  return null;
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
      statusCode: webhookResultStatusCode(result.status),
      body: {
        ok: webhookResultOk(result.status),
        provider: input.provider,
        status: result.status,
        idempotencyKey: result.idempotencyKey,
        paymentAttemptId: result.paymentAttemptId,
        paymentEventId: result.paymentEventId,
        message: webhookResultMessage(result.status)
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
