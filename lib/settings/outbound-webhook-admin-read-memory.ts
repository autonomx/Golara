import type { OutboundWebhookAdminListItemDto, OutboundWebhookAdminRecordSnapshot } from './outbound-webhook-admin-read-model';
import { buildOutboundDeliveryDetailDto, buildOutboundDeliveryListItemDto } from './outbound-webhook-admin-read-model';
import type { OutboundWebhookAdminReadPlan } from './outbound-webhook-admin-read-plan';

export type OutboundWebhookAdminMemoryReadResult = {
  items: OutboundWebhookAdminListItemDto[];
  detail: ReturnType<typeof buildOutboundDeliveryDetailDto> | null;
  auditLabels: string[];
  rejected: string[];
};

function matchesScalar(value: unknown, expected: unknown) {
  return expected == null || value === expected;
}

function matchesRange(value: string | Date, range: unknown) {
  if (!range || typeof range !== 'object') return true;
  const iso = new Date(value).toISOString();
  const { gte, lte } = range as { gte?: string; lte?: string };
  return (!gte || iso >= gte) && (!lte || iso <= lte);
}

function matchesRecord(record: OutboundWebhookAdminRecordSnapshot, where: OutboundWebhookAdminReadPlan['query']['where']) {
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'createdAt' || key === 'updatedAt') return matchesRange(record[key], expected);
    return matchesScalar(record[key as keyof OutboundWebhookAdminRecordSnapshot], expected);
  });
}

function sortedRecords(records: OutboundWebhookAdminRecordSnapshot[], plan: OutboundWebhookAdminReadPlan) {
  const { field, direction } = plan.query.orderBy;
  const sign = direction === 'asc' ? 1 : -1;
  return [...records].sort((left, right) => {
    const leftValue = String(left[field as keyof OutboundWebhookAdminRecordSnapshot] ?? '');
    const rightValue = String(right[field as keyof OutboundWebhookAdminRecordSnapshot] ?? '');
    return leftValue.localeCompare(rightValue) * sign;
  });
}

export function readOutboundWebhookAdminMemory(input: {
  records: OutboundWebhookAdminRecordSnapshot[];
  plan: OutboundWebhookAdminReadPlan;
  now: string | Date;
}): OutboundWebhookAdminMemoryReadResult {
  const filtered = sortedRecords(input.records.filter((record) => matchesRecord(record, input.plan.query.where)), input.plan);
  const selected = filtered.slice(0, input.plan.query.take);
  const listItems = selected.map((record) => buildOutboundDeliveryListItemDto(record, { now: input.now }));
  const detailRecord = input.plan.kind === 'detail' && input.plan.deliveryId ? filtered.find((record) => record.id === input.plan.deliveryId) ?? null : null;

  return {
    items: input.plan.kind === 'list' ? listItems : [],
    detail: detailRecord ? buildOutboundDeliveryDetailDto(detailRecord, { now: input.now }) : null,
    auditLabels: ['memory-read', `matched:${filtered.length}`, `returned:${selected.length}`, ...input.plan.auditLabels],
    rejected: [...input.plan.rejected]
  };
}
