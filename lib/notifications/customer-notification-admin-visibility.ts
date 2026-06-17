import type {
  CustomerNotificationAttemptEvidence,
  CustomerNotificationChannel,
  CustomerNotificationStatus,
  CustomerNotificationTemplateKey
} from './customer-notification-evidence';

export type CustomerNotificationAdminDeliveryVisibility = {
  kind: 'customer-notification-delivery';
  templateKey: CustomerNotificationTemplateKey;
  channel: CustomerNotificationChannel;
  status: CustomerNotificationStatus;
  label: string;
  retryable: boolean;
  attemptNumber: number;
  maxAttempts: number;
  nextRetryAt?: string;
  subject?: string;
  bodyPreview?: string;
  attempts: CustomerNotificationAttemptEvidence[];
};

const STATUS_LABELS: Record<CustomerNotificationStatus, string> = {
  queued: 'Queued for customer notification delivery',
  sent: 'Delivered to the customer notification provider',
  failed: 'Customer notification delivery failed',
  retry_pending: 'Retry pending for customer notification delivery',
  skipped: 'Customer notification delivery skipped'
};

function textValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function numberValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.trunc(value));
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.trunc(parsed));
    }
  }

  return fallback;
}

function booleanValue(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
}

function attemptsValue(value: unknown): CustomerNotificationAttemptEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((attempt): attempt is CustomerNotificationAttemptEvidence => {
    if (!attempt || typeof attempt !== 'object' || Array.isArray(attempt)) {
      return false;
    }

    const record = attempt as Record<string, unknown>;
    return typeof record.attemptNumber === 'number' && typeof record.status === 'string';
  });
}

export function customerNotificationAdminDeliveryVisibility(
  metadata: Record<string, unknown>
): CustomerNotificationAdminDeliveryVisibility | null {
  if (metadata.notificationEvidenceVersion !== 'p8-notification-v1') {
    return null;
  }

  const templateKey = textValue(metadata.notificationTemplateKey) as CustomerNotificationTemplateKey | undefined;
  const channel = textValue(metadata.notificationChannel) as CustomerNotificationChannel | undefined;
  const status = textValue(metadata.notificationStatus) as CustomerNotificationStatus | undefined;

  if (!templateKey || !channel || !status || !(status in STATUS_LABELS)) {
    return null;
  }

  const attemptNumber = numberValue(metadata.notificationAttemptNumber, 1);
  const maxAttempts = numberValue(metadata.notificationMaxAttempts, 3);
  const attempts = attemptsValue(metadata.customerNotificationAttempts);

  return {
    kind: 'customer-notification-delivery',
    templateKey,
    channel,
    status,
    label: STATUS_LABELS[status],
    retryable: booleanValue(metadata.notificationRetryable),
    attemptNumber,
    maxAttempts,
    nextRetryAt: textValue(metadata.nextRetryAt),
    subject: textValue(metadata.notificationSubject),
    bodyPreview: textValue(metadata.notificationBodyPreview),
    attempts
  };
}
