export type CustomerNotificationChannel = 'email' | 'sms' | 'in_app';

export type CustomerNotificationStatus =
  | 'queued'
  | 'sent'
  | 'failed'
  | 'retry_pending'
  | 'skipped';

export type CustomerNotificationTemplateKey =
  | 'method_confirmation'
  | 'manual_transfer_instructions'
  | 'wallet_receipt'
  | 'installment_status'
  | 'cod_collection_reminder';

export type CustomerNotificationEvidenceInput = {
  templateKey: CustomerNotificationTemplateKey;
  channel: CustomerNotificationChannel;
  status: CustomerNotificationStatus;
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
  provider?: string | null;
  providerMessageId?: string | null;
  attemptNumber?: number | null;
  maxAttempts?: number | null;
  nextRetryAt?: string | Date | null;
  queuedAt?: string | Date | null;
  sentAt?: string | Date | null;
  failedAt?: string | Date | null;
  skippedReason?: string | null;
  lastError?: string | null;
};

export type CustomerNotificationAttemptEvidence = {
  attemptNumber: number;
  status: CustomerNotificationStatus;
  provider?: string;
  providerMessageId?: string;
  queuedAt?: string;
  sentAt?: string;
  failedAt?: string;
  nextRetryAt?: string;
  lastError?: string;
};

export type CustomerNotificationEvidence = {
  notificationEvidenceVersion: 'p8-notification-v1';
  customerNotificationKind: 'customer_payment_communication';
  notificationTemplateKey: CustomerNotificationTemplateKey;
  notificationChannel: CustomerNotificationChannel;
  notificationLocale: 'en' | 'fa' | string;
  notificationStatus: CustomerNotificationStatus;
  notificationAttemptNumber: number;
  notificationMaxAttempts: number;
  notificationRetryable: boolean;
  notificationRecipient: string;
  notificationRecipientHash?: string;
  orderId?: string;
  orderNumber?: string;
  customerId?: string;
  paymentAttemptId?: string;
  selectedPaymentMethodKey?: string;
  notificationSubject?: string;
  notificationBodyPreview?: string;
  skippedReason?: string;
  customerNotificationAttempts: CustomerNotificationAttemptEvidence[];
};

function normalizeTimestamp(value?: string | Date | null): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function optionalString(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeAttemptNumber(value?: number | null): number {
  if (!Number.isFinite(value ?? Number.NaN)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value ?? 1));
}

function normalizeMaxAttempts(value?: number | null): number {
  if (!Number.isFinite(value ?? Number.NaN)) {
    return 3;
  }

  return Math.max(1, Math.trunc(value ?? 3));
}

function isRetryableNotificationStatus(status: CustomerNotificationStatus): boolean {
  return status === 'failed' || status === 'retry_pending';
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

export function customerNotificationAttemptEvidence(
  input: CustomerNotificationEvidenceInput
): CustomerNotificationAttemptEvidence {
  return withoutUndefined({
    attemptNumber: normalizeAttemptNumber(input.attemptNumber),
    status: input.status,
    provider: optionalString(input.provider),
    providerMessageId: optionalString(input.providerMessageId),
    queuedAt: normalizeTimestamp(input.queuedAt),
    sentAt: normalizeTimestamp(input.sentAt),
    failedAt: normalizeTimestamp(input.failedAt),
    nextRetryAt: normalizeTimestamp(input.nextRetryAt),
    lastError: optionalString(input.lastError)
  });
}

export function customerNotificationEvidence(
  input: CustomerNotificationEvidenceInput
): CustomerNotificationEvidence {
  const attemptNumber = normalizeAttemptNumber(input.attemptNumber);
  const maxAttempts = normalizeMaxAttempts(input.maxAttempts);
  const retryable = isRetryableNotificationStatus(input.status) && attemptNumber < maxAttempts;
  const attempt = customerNotificationAttemptEvidence(input);

  return withoutUndefined({
    notificationEvidenceVersion: 'p8-notification-v1',
    customerNotificationKind: 'customer_payment_communication',
    notificationTemplateKey: input.templateKey,
    notificationChannel: input.channel,
    notificationLocale: input.locale,
    notificationStatus: input.status,
    notificationAttemptNumber: attemptNumber,
    notificationMaxAttempts: maxAttempts,
    notificationRetryable: retryable,
    notificationRecipient: input.recipient,
    notificationRecipientHash: optionalString(input.recipientHash),
    orderId: optionalString(input.orderId),
    orderNumber: optionalString(input.orderNumber),
    customerId: optionalString(input.customerId),
    paymentAttemptId: optionalString(input.paymentAttemptId),
    selectedPaymentMethodKey: optionalString(input.selectedPaymentMethodKey),
    notificationSubject: optionalString(input.subject),
    notificationBodyPreview: optionalString(input.bodyPreview),
    skippedReason: optionalString(input.skippedReason),
    customerNotificationAttempts: [attempt]
  });
}

export function appendCustomerNotificationAttemptEvidence(
  existing: CustomerNotificationEvidence,
  input: CustomerNotificationEvidenceInput
): CustomerNotificationEvidence {
  const next = customerNotificationEvidence(input);

  return {
    ...next,
    customerNotificationAttempts: [
      ...existing.customerNotificationAttempts,
      customerNotificationAttemptEvidence(input)
    ]
  };
}
