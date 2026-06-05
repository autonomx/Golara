import type { NotificationDeliveryChannel, NotificationDeliveryProvider } from './notification-delivery-contract';

export type NotificationProviderReadinessCheckStatus = 'ready' | 'missing' | 'pending' | 'not_required';
export type NotificationProviderReadinessStatus = 'ready' | 'needs_operator_evidence' | 'manual_review' | 'disabled';

export type NotificationProviderReadinessCheck = {
  key: string;
  label: string;
  status: NotificationProviderReadinessCheckStatus;
  detail: string;
};

export type NotificationProviderReadinessInput = {
  channel: NotificationDeliveryChannel;
  provider: NotificationDeliveryProvider;
  env?: Record<string, string | undefined>;
  senderVerified?: boolean;
  templatesApproved?: boolean;
};

export type NotificationProviderReadiness = {
  channel: NotificationDeliveryChannel;
  provider: NotificationDeliveryProvider;
  status: NotificationProviderReadinessStatus;
  liveDeliveryEnabled: false;
  credentialEnvironmentVariables: string[];
  checks: NotificationProviderReadinessCheck[];
  blockers: string[];
  warnings: string[];
};

const PROVIDER_CREDENTIALS: Partial<Record<NotificationDeliveryProvider, string[]>> = {
  smtp: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'],
  resend: ['RESEND_API_KEY'],
  sendgrid: ['SENDGRID_API_KEY'],
  twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'],
  'meta-whatsapp': ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']
};

function hasCredential(env: Record<string, string | undefined>, key: string) {
  return Boolean(env[key]?.trim());
}

function providerSupportsChannel(provider: NotificationDeliveryProvider, channel: NotificationDeliveryChannel) {
  if (provider === 'disabled' || provider === 'manual' || provider === 'log') return true;
  if (channel === 'email') return provider === 'smtp' || provider === 'resend' || provider === 'sendgrid';
  if (channel === 'sms') return provider === 'twilio';
  return provider === 'twilio' || provider === 'meta-whatsapp';
}

export function buildNotificationProviderReadiness(input: NotificationProviderReadinessInput): NotificationProviderReadiness {
  const env = input.env ?? {};
  const credentialEnvironmentVariables = PROVIDER_CREDENTIALS[input.provider] ?? [];
  const blockers: string[] = [];
  const warnings: string[] = [];
  const checks: NotificationProviderReadinessCheck[] = [];

  if (!providerSupportsChannel(input.provider, input.channel)) {
    blockers.push('provider_channel_unsupported');
    checks.push({
      key: 'provider_channel_support',
      label: 'Provider/channel support',
      status: 'missing',
      detail: `${input.provider} is not configured as a ${input.channel} provider.`
    });
  } else {
    checks.push({
      key: 'provider_channel_support',
      label: 'Provider/channel support',
      status: 'ready',
      detail: `${input.provider} can be evaluated for ${input.channel} readiness.`
    });
  }

  if (input.provider === 'disabled') {
    warnings.push('provider_disabled');
    checks.push({
      key: 'provider_disabled',
      label: 'Provider disabled',
      status: 'not_required',
      detail: 'Delivery is intentionally disabled for this channel.'
    });
  }

  if (input.provider === 'manual') {
    warnings.push('manual_provider_requires_operator_review');
    checks.push({
      key: 'manual_review_required',
      label: 'Manual review required',
      status: 'pending',
      detail: 'Manual provider mode requires an operator to perform delivery outside Golara.'
    });
  }

  for (const key of credentialEnvironmentVariables) {
    const ready = hasCredential(env, key);
    if (!ready) blockers.push(`${key.toLowerCase()}_missing`);
    checks.push({
      key,
      label: key,
      status: ready ? 'ready' : 'missing',
      detail: ready ? `${key} is present in the runtime environment.` : `${key} must be provided outside source control.`
    });
  }

  if (!['disabled', 'manual', 'log'].includes(input.provider)) {
    const senderStatus = input.senderVerified ? 'ready' : 'pending';
    const templateStatus = input.templatesApproved ? 'ready' : 'pending';
    if (!input.senderVerified) blockers.push('sender_verification_missing');
    if (!input.templatesApproved) blockers.push('template_approval_missing');
    checks.push({
      key: 'sender_verification',
      label: 'Sender verification',
      status: senderStatus,
      detail: input.senderVerified ? 'Sender identity evidence is marked verified.' : 'Sender identity evidence is pending operator confirmation.'
    });
    checks.push({
      key: 'template_approval',
      label: 'Template approval',
      status: templateStatus,
      detail: input.templatesApproved ? 'Template approval evidence is marked approved.' : 'Template approval evidence is pending operator confirmation.'
    });
  }

  let status: NotificationProviderReadinessStatus = 'ready';
  if (input.provider === 'disabled') status = 'disabled';
  else if (input.provider === 'manual') status = 'manual_review';
  else if (blockers.length > 0) status = 'needs_operator_evidence';

  return {
    channel: input.channel,
    provider: input.provider,
    status,
    liveDeliveryEnabled: false,
    credentialEnvironmentVariables,
    checks,
    blockers,
    warnings
  };
}
