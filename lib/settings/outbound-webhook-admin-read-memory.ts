import type { OutboundWebhookAdminListItemDto, OutboundWebhookAdminRecordSnapshot } from './outbound-webhook-admin-read-model';
import { buildOutboundDeliveryDetailDto, buildOutboundDeliveryListItemDto } from './outbound-webhook-admin-read-model';
import type { OutboundWebhookAdminReadPlan } from './outbound-webhook-admin-read-plan';

export type OutboundWebhookAdminMemoryReadResult = {
  items: OutboundWebhookAdminListItemDto[];
  detail: ReturnType<typeof buildOutboundDeliveryDetailDto> | null;
  nextCursor: string | null;
  hasNextPage: boolean;
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

function pageFrom(records: OutboundWebhookAdminRecordSnapshot[], take: number) {
  const pageSize = Math.max(0, take - 1);
  const hasNextPage = records.length > pageSize;
  const visible = records.slice(0, pageSize || records.length);
  const nextCursor = hasNextPage ? records[pageSize]?.id ?? null : null;
  return { visible, hasNextPage, nextCursor };
}

export function readOutboundWebhookAdminMemory(input: {
  records: OutboundWebhookAdminRecordSnapshot[];
  plan: OutboundWebhookAdminReadPlan;
  now: string | Date;
}): OutboundWebhookAdminMemoryReadResult {
  const filtered = sortedRecords(input.records.filter((record) => matchesRecord(record, input.plan.query.where)), input.plan);
  const page = pageFrom(filtered, input.plan.query.take);
  const listItems = page.visible.map((record) => buildOutboundDeliveryListItemDto(record, { now: input.now }));
  const detailRecord = input.plan.kind === 'detail' && input.plan.deliveryId ? filtered.find((record) => record.id === input.plan.deliveryId) ?? null : null;

  return {
    items: input.plan.kind === 'list' ? listItems : [],
    detail: detailRecord ? buildOutboundDeliveryDetailDto(detailRecord, { now: input.now }) : null,
    nextCursor: page.nextCursor,
    hasNextPage: page.hasNextPage,
    auditLabels: ['memory-read', `matched:${filtered.length}`, `returned:${page.visible.length}`, `hasNext:${page.hasNextPage}`, ...input.plan.auditLabels],
    rejected: [...input.plan.rejected]
  };
}
