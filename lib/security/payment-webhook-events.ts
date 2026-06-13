import { redactLogValue } from '@/lib/security/redacted-logging';

type PaymentWebhookEventOutcome = 'recorded' | 'duplicate' | 'missing_attempt' | 'needs_attention';

type PaymentWebhookEventLogInput = {
  event: 'payment_webhook';
  outcome: PaymentWebhookEventOutcome;
  provider?: string;
  status?: string;
  settlementStatus?: string;
  stateTrusted?: boolean;
  reason?: string;
};

function safeText(value?: string, maxLength = 120) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return redactLogValue(normalized).slice(0, maxLength);
}

export function logPaymentWebhookEvent(input: PaymentWebhookEventLogInput) {
  const payload = {
    event: input.event,
    outcome: input.outcome,
    provider: safeText(input.provider, 48),
    status: safeText(input.status, 48),
    settlementStatus: safeText(input.settlementStatus, 48),
    stateTrusted: input.stateTrusted,
    reason: safeText(input.reason, 160),
    at: new Date().toISOString()
  };

  const message = `[payment-webhook] ${input.event}:${input.outcome}`;
  if (input.outcome === 'recorded') {
    console.info(message, payload);
    return;
  }
  console.warn(message, payload);
}
