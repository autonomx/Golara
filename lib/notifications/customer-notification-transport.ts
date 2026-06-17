import {
  appendCustomerNotificationAttemptEvidence,
  customerNotificationEvidence,
  type CustomerNotificationChannel,
  type CustomerNotificationEvidence,
  type CustomerNotificationEvidenceInput,
  type CustomerNotificationStatus,
  type CustomerNotificationTemplateKey
} from './customer-notification-evidence';

export type CustomerNotificationTransportStatus = Extract<CustomerNotificationStatus, 'queued' | 'sent' | 'failed' | 'retry_pending' | 'skipped'>;

export type CustomerNotificationTransportPayload = {
  templateKey: CustomerNotificationTemplateKey;
  channel: CustomerNotificationChannel;
  locale: 'en' | 'fa' | string;
  recipient: string;
  recipientHash?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  customerId?: string | null;
  paymentAttemptId?: string | null;
  selectedPaymentMethodKey?: string | null;
  subject?: string | null;
  bodyPreview?: string | null;
  maxAttempts?: number | null;
};

export type CustomerNotificationTransportAttemptInput = CustomerNotificationTransportPayload & {
  status: CustomerNotificationTransportStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  attemptNumber?: number | null;
  queuedAt?: string | Date | null;
  sentAt?: string | Date | null;
  failedAt?: string | Date | null;
  nextRetryAt?: string | Date | null;
  skippedReason?: string | null;
  lastError?: string | null;
};

export type CustomerNotificationTransportRetryPlan = {
  shouldRetry: boolean;
  nextAttemptNumber: number;
  maxAttempts: number;
  nextRetryAt?: string;
};

export type CustomerNotificationTransportAttemptOutcome = {
  evidence: CustomerNotificationEvidence;
  retryPlan: CustomerNotificationTransportRetryPlan;
};

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 15 * 60 * 1000;

function normalizePositiveInteger(value: number | null | undefined, fallback: number): number {
  if (!Number.isFinite(value ?? Number.NaN)) {
    return fallback;
  }

  return Math.max(1, Math.trunc(value ?? fallback));
}

function normalizeDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function toEvidenceInput(input: CustomerNotificationTransportAttemptInput): CustomerNotificationEvidenceInput {
  return {
    templateKey: input.templateKey,
    channel: input.channel,
    status: input.status,
    locale: input.locale,
    recipient: input.recipient,
    recipientHash: input.recipientHash,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    customerId: input.customerId,
    paymentAttemptId: input.paymentAttemptId,
    selectedPaymentMethodKey: input.selectedPaymentMethodKey,
    subject: input.subject,
    bodyPreview: input.bodyPreview,
    provider: input.provider,
    providerMessageId: input.providerMessageId,
    attemptNumber: input.attemptNumber,
    maxAttempts: input.maxAttempts,
    nextRetryAt: input.nextRetryAt,
    queuedAt: input.queuedAt,
    sentAt: input.sentAt,
    failedAt: input.failedAt,
    skippedReason: input.skippedReason,
    lastError: input.lastError
  };
}

export function customerNotificationTransportRetryPlan(
  evidence: CustomerNotificationEvidence,
  options: { retryDelayMs?: number | null; now?: string | Date | null } = {}
): CustomerNotificationTransportRetryPlan {
  const nextAttemptNumber = normalizePositiveInteger(evidence.notificationAttemptNumber, 1) + 1;
  const maxAttempts = normalizePositiveInteger(evidence.notificationMaxAttempts, DEFAULT_MAX_ATTEMPTS);
  const shouldRetry = evidence.notificationRetryable && nextAttemptNumber <= maxAttempts;

  if (!shouldRetry) {
    return {
      shouldRetry,
      nextAttemptNumber,
      maxAttempts
    };
  }

  const retryDelayMs = normalizePositiveInteger(options.retryDelayMs, DEFAULT_RETRY_DELAY_MS);
  const now = options.now ? normalizeDate(options.now) : new Date();

  return {
    shouldRetry,
    nextAttemptNumber,
    maxAttempts,
    nextRetryAt: new Date(now.getTime() + retryDelayMs).toISOString()
  };
}

export function createQueuedCustomerNotificationTransportEvidence(
  payload: CustomerNotificationTransportPayload,
  options: { queuedAt?: string | Date | null; maxAttempts?: number | null } = {}
): CustomerNotificationTransportAttemptOutcome {
  const evidence = customerNotificationEvidence({
    ...payload,
    status: 'queued',
    attemptNumber: 1,
    maxAttempts: options.maxAttempts ?? payload.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    queuedAt: options.queuedAt ?? new Date()
  });

  return {
    evidence,
    retryPlan: customerNotificationTransportRetryPlan(evidence, { now: options.queuedAt ?? undefined })
  };
}

export function customerNotificationTransportAttempt(
  input: CustomerNotificationTransportAttemptInput,
  existingEvidence?: CustomerNotificationEvidence,
  options: { retryDelayMs?: number | null; now?: string | Date | null } = {}
): CustomerNotificationTransportAttemptOutcome {
  const evidenceInput = toEvidenceInput(input);
  const evidence = existingEvidence
    ? appendCustomerNotificationAttemptEvidence(existingEvidence, evidenceInput)
    : customerNotificationEvidence(evidenceInput);

  return {
    evidence,
    retryPlan: customerNotificationTransportRetryPlan(evidence, options)
  };
}
