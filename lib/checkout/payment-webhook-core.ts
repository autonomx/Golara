import { createHash } from 'node:crypto';

export type PaymentWebhookProvider = 'stripe' | 'zarinpal' | 'unknown';
export type PaymentWebhookStatus = 'paid' | 'failed' | 'cancelled' | 'pending';

export type PaymentWebhookEventInput = {
  provider?: string;
  eventType?: string;
  payload?: Record<string, unknown> | null;
  headers?: Record<string, string | string[] | undefined>;
  receivedAt?: Date | string;
};

export type NormalizedPaymentWebhookEvent = {
  provider: PaymentWebhookProvider;
  eventName: string;
  status: PaymentWebhookStatus;
  providerReference?: string;
  orderNumber?: string;
  publicLookupToken?: string;
  amountCents?: number;
  currency?: string;
  receivedAt: Date;
  payloadDigest: string;
  idempotencyKey: string;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
}

function digestPayload(payload: unknown) {
  return createHash('sha256').update(stableStringify(payload ?? {})).digest('hex');
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.trunc(value);
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return undefined;
}

function nestedRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function normalizePaymentWebhookProvider(provider?: string): PaymentWebhookProvider {
  const normalized = provider?.trim().toLowerCase();
  if (normalized === 'stripe') return 'stripe';
  if (normalized === 'zarinpal' || normalized === 'zarin-pal') return 'zarinpal';
  return 'unknown';
}

export function normalizeStripeWebhookStatus(eventType: string | undefined, paymentStatus?: unknown): PaymentWebhookStatus {
  const event = eventType?.trim().toLowerCase();
  const status = optionalText(paymentStatus)?.toLowerCase();
  if (event === 'checkout.session.completed' && status === 'paid') return 'paid';
  if (event === 'checkout.session.async_payment_failed' || event === 'payment_intent.payment_failed') return 'failed';
  if (event === 'checkout.session.expired') return 'cancelled';
  return 'pending';
}

export function normalizeZarinpalWebhookStatus(status?: unknown): PaymentWebhookStatus {
  const normalized = optionalText(status)?.toLowerCase();
  if (normalized === 'ok' || normalized === 'paid' || normalized === '100' || normalized === '101') return 'paid';
  if (normalized === 'nok' || normalized === 'failed' || normalized === 'error') return 'failed';
  if (normalized === 'cancel' || normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  return 'pending';
}

export function paymentWebhookIdempotencyKey(event: Pick<NormalizedPaymentWebhookEvent, 'provider' | 'eventName' | 'providerReference' | 'payloadDigest'>) {
  return [event.provider, event.eventName, event.providerReference || 'missing-reference', event.payloadDigest].join(':');
}

export function normalizePaymentWebhookEvent(input: PaymentWebhookEventInput): NormalizedPaymentWebhookEvent {
  const provider = normalizePaymentWebhookProvider(input.provider);
  const payload = nestedRecord(input.payload);
  const receivedAt = input.receivedAt ? new Date(input.receivedAt) : new Date();
  const payloadDigest = digestPayload(payload);

  if (provider === 'stripe') {
    const data = nestedRecord(payload.data);
    const object = nestedRecord(data.object);
    const metadata = nestedRecord(object.metadata);
    const eventName = optionalText(input.eventType) || optionalText(payload.type) || 'stripe.unknown';
    const event: NormalizedPaymentWebhookEvent = {
      provider,
      eventName,
      status: normalizeStripeWebhookStatus(eventName, object.payment_status || object.status),
      providerReference: optionalText(object.id) || optionalText(payload.id),
      orderNumber: optionalText(metadata.orderNumber) || optionalText(metadata.order_number),
      publicLookupToken: optionalText(metadata.publicLookupToken) || optionalText(metadata.public_lookup_token),
      amountCents: optionalNumber(object.amount_total || object.amount_received || object.amount),
      currency: optionalText(object.currency)?.toLowerCase(),
      receivedAt,
      payloadDigest,
      idempotencyKey: ''
    };
    event.idempotencyKey = paymentWebhookIdempotencyKey(event);
    return event;
  }

  if (provider === 'zarinpal') {
    const eventName = optionalText(input.eventType) || 'zarinpal.payment';
    const authority = optionalText(payload.Authority) || optionalText(payload.authority);
    const refId = optionalText(payload.RefID) || optionalText(payload.ref_id) || optionalText(payload.refId);
    const event: NormalizedPaymentWebhookEvent = {
      provider,
      eventName,
      status: normalizeZarinpalWebhookStatus(payload.Status || payload.status || payload.code),
      providerReference: refId || authority,
      orderNumber: optionalText(payload.orderNumber) || optionalText(payload.order_number) || optionalText(payload.order),
      publicLookupToken: optionalText(payload.publicLookupToken) || optionalText(payload.public_lookup_token) || optionalText(payload.token),
      amountCents: optionalNumber(payload.amountCents || payload.amount_cents || payload.amount),
      currency: optionalText(payload.currency)?.toLowerCase() || 'irt',
      receivedAt,
      payloadDigest,
      idempotencyKey: ''
    };
    event.idempotencyKey = paymentWebhookIdempotencyKey(event);
    return event;
  }

  const event: NormalizedPaymentWebhookEvent = {
    provider,
    eventName: optionalText(input.eventType) || 'payment.unknown',
    status: 'pending',
    providerReference: optionalText(payload.id) || optionalText(payload.reference),
    receivedAt,
    payloadDigest,
    idempotencyKey: ''
  };
  event.idempotencyKey = paymentWebhookIdempotencyKey(event);
  return event;
}

export function summarizePaymentWebhookSettlement(events: NormalizedPaymentWebhookEvent[]) {
  return events.reduce((summary, event) => {
    summary.total += 1;
    if (event.status === 'paid') summary.paid += 1;
    if (event.status === 'failed') summary.failed += 1;
    if (event.status === 'cancelled') summary.cancelled += 1;
    if (event.status === 'pending') summary.pending += 1;
    summary.needsAttention = summary.failed + summary.pending;
    return summary;
  }, { total: 0, paid: 0, failed: 0, cancelled: 0, pending: 0, needsAttention: 0 });
}
