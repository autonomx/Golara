import type {
  OutboundWebhookAdminNormalizedFilters,
  OutboundWebhookAdminNormalizedSort,
  OutboundWebhookAdminPagination
} from './outbound-webhook-admin-read-model';

export const OUTBOUND_WEBHOOK_ADMIN_SAFE_FIELDS = [
  'id',
  'configurationKey',
  'eventType',
  'eventRef',
  'status',
  'attemptCount',
  'nextEligibleAttemptAt',
  'lastOutcomeCategory',
  'lastResponseCode',
  'deadLetterSummary',
  'payloadDigest',
  'idempotencyKey',
  'createdAt',
  'updatedAt'
] as const;

export type OutboundWebhookAdminSafeField = (typeof OUTBOUND_WEBHOOK_ADMIN_SAFE_FIELDS)[number];

export type OutboundWebhookAdminReadQuerySpec = {
  where: Record<string, string | { gte?: string; lte?: string }>;
  orderBy: { field: string; direction: 'asc' | 'desc' };
  take: number;
  cursor: string | null;
  select: Record<OutboundWebhookAdminSafeField, true>;
  rejected: string[];
  auditLabels: string[];
};

function addStringFilter(target: Record<string, string | { gte?: string; lte?: string }>, key: string, value: string | null) {
  if (value) target[key] = value;
}

function addDateRange(target: Record<string, string | { gte?: string; lte?: string }>, key: string, from: string | null, to: string | null) {
  if (from || to) target[key] = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
}

function normalizedCursor(cursor: string | null) {
  if (!cursor) return { cursor: null, rejected: [] as string[] };
  const normalized = cursor.trim();
  if (!normalized) return { cursor: null, rejected: [] as string[] };
  if (normalized.length > 160) return { cursor: null, rejected: ['cursor'] };
  if (!/^[A-Za-z0-9:_-]+$/.test(normalized)) return { cursor: null, rejected: ['cursor'] };
  return { cursor: normalized, rejected: [] as string[] };
}

export function buildOutboundWebhookAdminReadQuerySpec(input: {
  filters: OutboundWebhookAdminNormalizedFilters;
  sort: OutboundWebhookAdminNormalizedSort;
  pagination: OutboundWebhookAdminPagination;
}): OutboundWebhookAdminReadQuerySpec {
  const where: OutboundWebhookAdminReadQuerySpec['where'] = {};
  const cursor = normalizedCursor(input.pagination.cursor);
  addStringFilter(where, 'status', input.filters.status);
  addStringFilter(where, 'configurationKey', input.filters.configurationKey);
  addStringFilter(where, 'eventType', input.filters.eventType);
  addStringFilter(where, 'eventRef', input.filters.eventRef);
  addStringFilter(where, 'idempotencyKey', input.filters.idempotencyKey);
  addStringFilter(where, 'payloadDigest', input.filters.payloadDigest);
  addDateRange(where, 'createdAt', input.filters.createdFrom, input.filters.createdTo);
  addDateRange(where, 'updatedAt', input.filters.updatedFrom, input.filters.updatedTo);

  return {
    where,
    orderBy: { field: input.sort.field, direction: input.sort.direction },
    take: input.pagination.pageSize + 1,
    cursor: cursor.cursor,
    select: OUTBOUND_WEBHOOK_ADMIN_SAFE_FIELDS.reduce(
      (selection, field) => ({ ...selection, [field]: true }),
      {} as Record<OutboundWebhookAdminSafeField, true>
    ),
    rejected: [...input.filters.rejected, ...input.sort.rejected, ...input.pagination.rejected, ...cursor.rejected],
    auditLabels: [
      `filters:${Object.keys(where).length}`,
      `sort:${input.sort.field}:${input.sort.direction}`,
      `take:${input.pagination.pageSize + 1}`,
      `cursor:${cursor.cursor ? 'present' : 'absent'}`
    ]
  };
}
