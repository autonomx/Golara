import {
  OUTBOUND_WEBHOOK_DELIVERY_STATUSES,
  type OutboundWebhookDeliveryStatus
} from './outbound-webhook-delivery-plan';

export const OUTBOUND_WEBHOOK_ADMIN_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'nextEligibleAttemptAt',
  'attemptCount',
  'status'
] as const;

export type OutboundWebhookAdminSortField = (typeof OUTBOUND_WEBHOOK_ADMIN_SORT_FIELDS)[number];
export type OutboundWebhookAdminSortDirection = 'asc' | 'desc';

export type OutboundWebhookAdminFilterQuery = {
  status?: string | null;
  configurationKey?: string | null;
  eventType?: string | null;
  eventRef?: string | null;
  idempotencyKey?: string | null;
  payloadDigest?: string | null;
  createdFrom?: string | Date | null;
  createdTo?: string | Date | null;
  updatedFrom?: string | Date | null;
  updatedTo?: string | Date | null;
};

export type OutboundWebhookAdminNormalizedFilters = {
  status: OutboundWebhookDeliveryStatus | null;
  configurationKey: string | null;
  eventType: string | null;
  eventRef: string | null;
  idempotencyKey: string | null;
  payloadDigest: string | null;
  createdFrom: string | null;
  createdTo: string | null;
  updatedFrom: string | null;
  updatedTo: string | null;
  rejected: string[];
};

export type OutboundWebhookAdminNormalizedSort = {
  field: OutboundWebhookAdminSortField;
  direction: OutboundWebhookAdminSortDirection;
  rejected: string[];
};

export type OutboundWebhookAdminPagination = {
  pageSize: number;
  cursor: string | null;
  rejected: string[];
};

export type OutboundWebhookAdminRecordSnapshot = {
  id: string;
  configurationKey: string;
  eventType: string;
  eventRef: string;
  status: OutboundWebhookDeliveryStatus;
  attemptCount: number;
  nextEligibleAttemptAt?: string | Date | null;
  lastOutcomeCategory?: string | null;
  lastResponseCode?: number | null;
  deadLetterSummary?: string | null;
  payloadDigest: string;
  idempotencyKey: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type OutboundWebhookAdminListItemDto = {
  id: string;
  configurationKey: string;
  eventType: string;
  eventRef: string;
  status: OutboundWebhookDeliveryStatus;
  attemptCount: number;
  nextEligibleAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
  payloadDigest: string;
  idempotencyKey: string;
  safeOutcomeLabel: string;
  terminalLabel: string;
  deadLetterLabel: string;
  staleLabel: string;
};

export type OutboundWebhookAdminDetailDto = OutboundWebhookAdminListItemDto & {
  lastResponseCode: number | null;
  redactedDeliverySummary: string;
  redactionAuditLabels: string[];
};

export type OutboundWebhookAdminPaginationEnvelope<T> = {
  items: T[];
  pageSize: number;
  nextCursor: string | null;
  hasNextPage: boolean;
  normalizedFilterSummary: OutboundWebhookAdminNormalizedFilters;
  normalizedSortSummary: OutboundWebhookAdminNormalizedSort;
};

function normalizeToken(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeDate(value: string | Date | null | undefined, rejected: string[], label: string) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    rejected.push(label);
    return null;
  }
  return date.toISOString();
}

function normalizeDateLike(value: string | Date | null | undefined) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeAttemptCount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeOptionalNumber(value: number | null | undefined) {
  return Number.isFinite(value ?? NaN) ? Math.trunc(value ?? 0) : null;
}

function isStatus(value: string | null): value is OutboundWebhookDeliveryStatus {
  return OUTBOUND_WEBHOOK_DELIVERY_STATUSES.includes(value as OutboundWebhookDeliveryStatus);
}

function isSortField(value: string | null): value is OutboundWebhookAdminSortField {
  return OUTBOUND_WEBHOOK_ADMIN_SORT_FIELDS.includes(value as OutboundWebhookAdminSortField);
}

export function normalizeOutboundDeliveryAdminFilters(
  query: OutboundWebhookAdminFilterQuery = {}
): OutboundWebhookAdminNormalizedFilters {
  const rejected: string[] = [];
  const statusToken = normalizeToken(query.status);
  const status = statusToken && isStatus(statusToken) ? statusToken : null;
  if (statusToken && !status) rejected.push('status');

  return {
    status,
    configurationKey: normalizeToken(query.configurationKey),
    eventType: normalizeToken(query.eventType),
    eventRef: normalizeToken(query.eventRef),
    idempotencyKey: normalizeToken(query.idempotencyKey),
    payloadDigest: normalizeToken(query.payloadDigest),
    createdFrom: normalizeDate(query.createdFrom, rejected, 'createdFrom'),
    createdTo: normalizeDate(query.createdTo, rejected, 'createdTo'),
    updatedFrom: normalizeDate(query.updatedFrom, rejected, 'updatedFrom'),
    updatedTo: normalizeDate(query.updatedTo, rejected, 'updatedTo'),
    rejected
  };
}

export function normalizeOutboundDeliveryAdminSort(input: {
  field?: string | null;
  direction?: string | null;
} = {}): OutboundWebhookAdminNormalizedSort {
  const rejected: string[] = [];
  const fieldToken = normalizeToken(input.field);
  const directionToken = normalizeToken(input.direction)?.toLowerCase() ?? null;
  const field = fieldToken && isSortField(fieldToken) ? fieldToken : 'createdAt';
  const direction = directionToken === 'asc' || directionToken === 'desc' ? directionToken : 'desc';
  if (fieldToken && !isSortField(fieldToken)) rejected.push('field');
  if (directionToken && directionToken !== 'asc' && directionToken !== 'desc') rejected.push('direction');
  return { field, direction, rejected };
}

export function normalizeOutboundDeliveryAdminPagination(input: {
  pageSize?: number | string | null;
  cursor?: string | null;
} = {}): OutboundWebhookAdminPagination {
  const rejected: string[] = [];
  const parsed = typeof input.pageSize === 'string' ? Number.parseInt(input.pageSize, 10) : input.pageSize;
  const pageSize = Number.isFinite(parsed ?? NaN) ? Math.min(100, Math.max(1, Math.floor(parsed ?? 25))) : 25;
  if (input.pageSize != null && !Number.isFinite(parsed ?? NaN)) rejected.push('pageSize');
  return {
    pageSize,
    cursor: normalizeToken(input.cursor),
    rejected
  };
}

function safeOutcomeLabel(record: OutboundWebhookAdminRecordSnapshot) {
  return normalizeToken(record.lastOutcomeCategory) ?? 'not_attempted';
}

function terminalLabel(status: OutboundWebhookDeliveryStatus) {
  if (status === 'accepted') return 'accepted';
  if (status === 'cancelled') return 'canceled';
  if (status === 'dead_letter') return 'exhausted';
  if (status === 'failed') return 'failed terminal';
  return 'not terminal';
}

function deadLetterLabel(record: OutboundWebhookAdminRecordSnapshot) {
  if (record.status !== 'dead_letter') return 'not dead lettered';
  return normalizeToken(record.deadLetterSummary) ? 'dead lettered with summary' : 'dead lettered';
}

function staleLabel(record: OutboundWebhookAdminRecordSnapshot, now: string | Date) {
  const eligibleAt = normalizeDateLike(record.nextEligibleAttemptAt);
  const nowIso = normalizeDateLike(now);
  if (!eligibleAt || !nowIso || record.status !== 'retry_wait') return 'recent activity';
  return eligibleAt <= nowIso ? 'stale retry wait' : 'pending eligibility';
}

export function buildOutboundDeliveryListItemDto(
  record: OutboundWebhookAdminRecordSnapshot,
  options: { now: string | Date }
): OutboundWebhookAdminListItemDto {
  return {
    id: record.id,
    configurationKey: record.configurationKey,
    eventType: record.eventType,
    eventRef: record.eventRef,
    status: record.status,
    attemptCount: normalizeAttemptCount(record.attemptCount),
    nextEligibleAttemptAt: normalizeDateLike(record.nextEligibleAttemptAt),
    createdAt: normalizeDateLike(record.createdAt) ?? new Date(0).toISOString(),
    updatedAt: normalizeDateLike(record.updatedAt) ?? new Date(0).toISOString(),
    payloadDigest: record.payloadDigest,
    idempotencyKey: record.idempotencyKey,
    safeOutcomeLabel: safeOutcomeLabel(record),
    terminalLabel: terminalLabel(record.status),
    deadLetterLabel: deadLetterLabel(record),
    staleLabel: staleLabel(record, options.now)
  };
}

export function buildOutboundDeliveryDetailDto(
  record: OutboundWebhookAdminRecordSnapshot,
  options: { now: string | Date }
): OutboundWebhookAdminDetailDto {
  const item = buildOutboundDeliveryListItemDto(record, options);
  return {
    ...item,
    lastResponseCode: normalizeOptionalNumber(record.lastResponseCode),
    redactedDeliverySummary: `${item.eventType}:${item.eventRef}:${item.status}`,
    redactionAuditLabels: ['raw_payload:excluded', 'secret_values:excluded', 'receiver_body:excluded']
  };
}

export function buildOutboundDeliveryPaginationEnvelope<T>(input: {
  items: T[];
  pageSize: number;
  nextCursor?: string | null;
  filters: OutboundWebhookAdminNormalizedFilters;
  sort: OutboundWebhookAdminNormalizedSort;
}): OutboundWebhookAdminPaginationEnvelope<T> {
  return {
    items: input.items,
    pageSize: input.pageSize,
    nextCursor: normalizeToken(input.nextCursor),
    hasNextPage: Boolean(normalizeToken(input.nextCursor)),
    normalizedFilterSummary: input.filters,
    normalizedSortSummary: input.sort
  };
}
