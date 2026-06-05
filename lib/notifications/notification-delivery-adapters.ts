import { buildNotificationDeliveryPlan, type NotificationDeliveryPlan, type NotificationDeliveryPlanInput } from './notification-delivery-contract';

export const NOTIFICATION_DELIVERY_ADAPTER_KINDS = ['disabled', 'manual', 'log'] as const;

export type NotificationDeliveryAdapterKind = (typeof NOTIFICATION_DELIVERY_ADAPTER_KINDS)[number];

export type NotificationDeliveryAdapterInput = NotificationDeliveryPlanInput & {
  adapter: NotificationDeliveryAdapterKind;
  operatorNote?: string | null;
};

export type NotificationDeliveryAdapterResult = {
  adapter: NotificationDeliveryAdapterKind;
  plan: NotificationDeliveryPlan;
  handled: boolean;
  action: 'skipped' | 'manual_review' | 'logged';
  liveDeliveryEnabled: false;
  operatorNoteLabel: string | null;
  auditLabels: string[];
};

function normalizeLabel(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function buildAuditLabels(input: NotificationDeliveryAdapterInput, plan: NotificationDeliveryPlan) {
  const labels = [
    `channel:${plan.channel}`,
    `provider:${plan.provider}`,
    `adapter:${input.adapter}`,
    `status:${plan.status}`,
    `template:${plan.templateKey}`
  ];

  if (plan.reasons.length > 0) {
    labels.push(`reasons:${plan.reasons.join(',')}`);
  }

  return labels;
}

export function runNotificationDeliveryAdapter(input: NotificationDeliveryAdapterInput): NotificationDeliveryAdapterResult {
  const plan = buildNotificationDeliveryPlan({
    channel: input.channel,
    provider: input.provider,
    templateKey: input.templateKey,
    recipient: input.recipient,
    subject: input.subject,
    bodyPreview: input.bodyPreview,
    liveDeliveryEnabled: false,
    providerReady: input.providerReady
  });

  let action: NotificationDeliveryAdapterResult['action'] = 'logged';
  if (input.adapter === 'disabled') action = 'skipped';
  if (input.adapter === 'manual') action = 'manual_review';

  return {
    adapter: input.adapter,
    plan,
    handled: true,
    action,
    liveDeliveryEnabled: false,
    operatorNoteLabel: normalizeLabel(input.operatorNote),
    auditLabels: buildAuditLabels(input, plan)
  };
}
