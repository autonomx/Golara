import type { OutboundWebhookAdminReadQuerySpec } from './outbound-webhook-admin-read-query';

export type OutboundWebhookAdminReadPlanKind = 'list' | 'detail';

export type OutboundWebhookAdminReadPlan = {
  kind: OutboundWebhookAdminReadPlanKind;
  query: OutboundWebhookAdminReadQuerySpec;
  deliveryId: string | null;
  auditLabels: string[];
  rejected: string[];
};

function normalizedId(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

export function buildOutboundWebhookAdminListReadPlan(query: OutboundWebhookAdminReadQuerySpec): OutboundWebhookAdminReadPlan {
  return {
    kind: 'list',
    query,
    deliveryId: null,
    auditLabels: ['kind:list', ...query.auditLabels],
    rejected: [...query.rejected]
  };
}

export function buildOutboundWebhookAdminDetailReadPlan(input: {
  deliveryId?: string | null;
  query: OutboundWebhookAdminReadQuerySpec;
}): OutboundWebhookAdminReadPlan {
  const deliveryId = normalizedId(input.deliveryId);
  return {
    kind: 'detail',
    query: input.query,
    deliveryId,
    auditLabels: ['kind:detail', `delivery:${deliveryId ? 'present' : 'missing'}`, ...input.query.auditLabels],
    rejected: deliveryId ? [...input.query.rejected] : [...input.query.rejected, 'deliveryId']
  };
}
