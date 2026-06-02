import 'server-only';

import { createHash } from 'node:crypto';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';
import { DEFAULT_WEBHOOK_CONFIGURATION, normalizeWebhookEventName, normalizeWebhookKey, normalizeWebhookTargetUrl } from '@/lib/settings/webhook-configuration';

export const WEBHOOK_EVENT_LOG_STATUSES = ['queued', 'delivering', 'delivered', 'failed', 'retry_scheduled', 'abandoned'] as const;

export type WebhookEventLogStatus = (typeof WEBHOOK_EVENT_LOG_STATUSES)[number];

export type WebhookEventLogRecord = {
  id: string;
  webhookConfigurationKey: string;
  eventName: string;
  targetUrl: string;
  payloadDigest: string;
  status: WebhookEventLogStatus;
  attemptCount: number;
  lastStatusCode?: number | null;
  lastError?: string | null;
  nextAttemptAt?: Date | null;
  deliveredAt?: Date | null;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
};

export type WebhookEventLogInput = {
  webhookConfigurationKey?: string | null;
  eventName: string;
  targetUrl: string;
  payload: unknown;
  status?: string | null;
  attemptCount?: number | null;
  lastStatusCode?: number | null;
  lastError?: string | null;
  nextAttemptAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  metadata?: Record<string, unknown>;
};

export type WebhookEventLogSummary = {
  total: number;
  queued: number;
  delivering: number;
  delivered: number;
  failed: number;
  retryScheduled: number;
  abandoned: number;
  needsAttention: number;
  recent: WebhookEventLogRecord[];
};

export const DEFAULT_WEBHOOK_EVENT_LOG_RECORD: WebhookEventLogRecord = {
  id: 'webhook-event-log-empty',
  webhookConfigurationKey: DEFAULT_WEBHOOK_CONFIGURATION.key,
  eventName: 'order.created',
  targetUrl: DEFAULT_WEBHOOK_CONFIGURATION.targetUrl,
  payloadDigest: createWebhookPayloadDigest({ empty: true }),
  status: 'queued',
  attemptCount: 0,
  lastStatusCode: null,
  lastError: null,
  nextAttemptAt: null,
  deliveredAt: null,
  metadata: {}
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeWebhookEventLogStatus(value?: string | null): WebhookEventLogStatus {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return WEBHOOK_EVENT_LOG_STATUSES.includes(normalized as WebhookEventLogStatus) ? normalized as WebhookEventLogStatus : 'queued';
}

function normalizeAttemptCount(value?: number | null) {
  if (!Number.isFinite(value ?? 0)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

function normalizeStatusCode(value?: number | null) {
  if (!Number.isFinite(value ?? NaN)) return null;
  const normalized = Math.floor(value ?? 0);
  return normalized >= 100 && normalized <= 599 ? normalized : null;
}

function normalizeDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

export function createWebhookPayloadDigest(payload: unknown) {
  return createHash('sha256').update(stableJson(payload)).digest('hex');
}

export function normalizeWebhookEventLogInput(input: WebhookEventLogInput): Omit<WebhookEventLogRecord, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    webhookConfigurationKey: normalizeWebhookKey(input.webhookConfigurationKey),
    eventName: normalizeWebhookEventName(input.eventName) ?? DEFAULT_WEBHOOK_EVENT_LOG_RECORD.eventName,
    targetUrl: normalizeWebhookTargetUrl(input.targetUrl),
    payloadDigest: createWebhookPayloadDigest(input.payload),
    status: normalizeWebhookEventLogStatus(input.status),
    attemptCount: normalizeAttemptCount(input.attemptCount),
    lastStatusCode: normalizeStatusCode(input.lastStatusCode),
    lastError: optionalText(input.lastError),
    nextAttemptAt: normalizeDate(input.nextAttemptAt),
    deliveredAt: normalizeDate(input.deliveredAt),
    metadata: input.metadata ?? {}
  };
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function mapWebhookEventLog(row: WebhookEventLogRecord & { metadata?: unknown }): WebhookEventLogRecord {
  return {
    id: row.id,
    webhookConfigurationKey: row.webhookConfigurationKey,
    eventName: row.eventName,
    targetUrl: row.targetUrl,
    payloadDigest: row.payloadDigest,
    status: normalizeWebhookEventLogStatus(row.status),
    attemptCount: normalizeAttemptCount(row.attemptCount),
    lastStatusCode: row.lastStatusCode ?? null,
    lastError: row.lastError ?? null,
    nextAttemptAt: row.nextAttemptAt ?? null,
    deliveredAt: row.deliveredAt ?? null,
    metadata: parseMetadata(row.metadata),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function buildWebhookEventLogSummary(records: WebhookEventLogRecord[]): WebhookEventLogSummary {
  const summary: WebhookEventLogSummary = {
    total: records.length,
    queued: 0,
    delivering: 0,
    delivered: 0,
    failed: 0,
    retryScheduled: 0,
    abandoned: 0,
    needsAttention: 0,
    recent: records.slice(0, 10)
  };

  for (const record of records) {
    if (record.status === 'queued') summary.queued += 1;
    if (record.status === 'delivering') summary.delivering += 1;
    if (record.status === 'delivered') summary.delivered += 1;
    if (record.status === 'failed') summary.failed += 1;
    if (record.status === 'retry_scheduled') summary.retryScheduled += 1;
    if (record.status === 'abandoned') summary.abandoned += 1;
    if (['failed', 'retry_scheduled', 'abandoned'].includes(record.status)) summary.needsAttention += 1;
  }

  return summary;
}

export const webhookEventLogService = {
  async listRecent(limit = 10): Promise<WebhookEventLogRecord[]> {
    if (!hasDatabase()) return [];
    const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));

    const rows = await prisma.$queryRaw<(WebhookEventLogRecord & { metadata?: unknown })[]>`
      SELECT "id", "webhookConfigurationKey", "eventName", "targetUrl", "payloadDigest", "status", "attemptCount", "lastStatusCode", "lastError", "nextAttemptAt", "deliveredAt", "metadata", "createdAt", "updatedAt"
      FROM "WebhookEventLog"
      ORDER BY "createdAt" DESC
      LIMIT ${safeLimit}
    `;

    return rows.map(mapWebhookEventLog);
  },

  async summary(limit = 10): Promise<WebhookEventLogSummary> {
    return buildWebhookEventLogSummary(await this.listRecent(limit));
  },

  async record(input: WebhookEventLogInput): Promise<WebhookEventLogRecord> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeWebhookEventLogInput(input);
    const rows = await prisma.$queryRaw<(WebhookEventLogRecord & { metadata?: unknown })[]>`
      INSERT INTO "WebhookEventLog" ("webhookConfigurationKey", "eventName", "targetUrl", "payloadDigest", "status", "attemptCount", "lastStatusCode", "lastError", "nextAttemptAt", "deliveredAt", "metadata")
      VALUES (${normalized.webhookConfigurationKey}, ${normalized.eventName}, ${normalized.targetUrl}, ${normalized.payloadDigest}, ${normalized.status}, ${normalized.attemptCount}, ${normalized.lastStatusCode}, ${normalized.lastError}, ${normalized.nextAttemptAt}, ${normalized.deliveredAt}, ${JSON.stringify(normalized.metadata ?? {})}::jsonb)
      ON CONFLICT ("payloadDigest") DO UPDATE SET
        "status" = EXCLUDED."status",
        "attemptCount" = EXCLUDED."attemptCount",
        "lastStatusCode" = EXCLUDED."lastStatusCode",
        "lastError" = EXCLUDED."lastError",
        "nextAttemptAt" = EXCLUDED."nextAttemptAt",
        "deliveredAt" = EXCLUDED."deliveredAt",
        "metadata" = EXCLUDED."metadata",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "webhookConfigurationKey", "eventName", "targetUrl", "payloadDigest", "status", "attemptCount", "lastStatusCode", "lastError", "nextAttemptAt", "deliveredAt", "metadata", "createdAt", "updatedAt"
    `;
    const record = mapWebhookEventLog(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.webhook_event_log.record',
      entity: 'webhookEventLog',
      entityId: record.id,
      summary: `Recorded webhook event log: ${record.eventName} (${record.status})`,
      metadata: {
        webhookConfigurationKey: record.webhookConfigurationKey,
        eventName: record.eventName,
        targetUrl: record.targetUrl,
        payloadDigest: record.payloadDigest,
        status: record.status,
        attemptCount: record.attemptCount,
        lastStatusCode: record.lastStatusCode
      }
    });

    return record;
  }
};
