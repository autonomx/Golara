export const NOTIFICATION_DELIVERY_CHANNELS = ['email', 'sms', 'whatsapp'] as const;
export const NOTIFICATION_DELIVERY_PROVIDERS = ['disabled', 'manual', 'log', 'smtp', 'resend', 'sendgrid', 'twilio', 'meta-whatsapp'] as const;
export const NOTIFICATION_DELIVERY_STATUSES = ['disabled', 'manual_review', 'planned', 'blocked'] as const;

export type NotificationDeliveryChannel = (typeof NOTIFICATION_DELIVERY_CHANNELS)[number];
export type NotificationDeliveryProvider = (typeof NOTIFICATION_DELIVERY_PROVIDERS)[number];
export type NotificationDeliveryStatus = (typeof NOTIFICATION_DELIVERY_STATUSES)[number];

export type NotificationDeliveryPlanInput = {
  channel: NotificationDeliveryChannel;
  provider: NotificationDeliveryProvider;
  templateKey: string;
  recipient: string;
  subject?: string | null;
  bodyPreview?: string | null;
  liveDeliveryEnabled?: boolean;
  providerReady?: boolean;
};

export type NotificationDeliveryPlan = {
  channel: NotificationDeliveryChannel;
  provider: NotificationDeliveryProvider;
  templateKey: string;
  recipientLabel: string;
  subjectLabel: string | null;
  bodyPreviewLabel: string | null;
  status: NotificationDeliveryStatus;
  liveDeliveryEnabled: false;
  reasons: string[];
};

function normalizeText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function hasRequiredRecipient(channel: NotificationDeliveryChannel, recipient: string | null) {
  if (!recipient) return false;
  if (channel === 'email') return recipient.includes('@');
  return /^\+?[0-9][0-9\s().-]{6,}$/.test(recipient);
}

export function buildNotificationDeliveryPlan(input: NotificationDeliveryPlanInput): NotificationDeliveryPlan {
  const templateKey = normalizeText(input.templateKey) ?? 'notification-template-missing';
  const recipient = normalizeText(input.recipient);
  const reasons: string[] = [];

  if (!hasRequiredRecipient(input.channel, recipient)) {
    reasons.push(`${input.channel}_recipient_missing_or_invalid`);
  }

  if (input.provider === 'disabled') {
    reasons.push('provider_disabled');
  }

  if (input.provider === 'manual') {
    reasons.push('manual_provider_requires_operator_review');
  }

  if (!input.providerReady && !['disabled', 'manual', 'log'].includes(input.provider)) {
    reasons.push('provider_readiness_evidence_missing');
  }

  let status: NotificationDeliveryStatus = 'planned';
  if (input.provider === 'disabled') status = 'disabled';
  else if (input.provider === 'manual') status = 'manual_review';
  else if (reasons.length > 0) status = 'blocked';

  return {
    channel: input.channel,
    provider: input.provider,
    templateKey,
    recipientLabel: recipient ?? 'Missing recipient',
    subjectLabel: normalizeText(input.subject),
    bodyPreviewLabel: normalizeText(input.bodyPreview),
    status,
    liveDeliveryEnabled: false,
    reasons
  };
}
