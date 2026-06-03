import 'server-only';

import { createHash } from 'node:crypto';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

export const IMPORT_EXPORT_JOB_KINDS = ['import', 'export'] as const;
export const IMPORT_EXPORT_JOB_TARGETS = ['products', 'categories', 'media', 'customers', 'orders', 'discounts', 'settings', 'custom'] as const;
export const IMPORT_EXPORT_JOB_STATUSES = ['queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled'] as const;

export type ImportExportJobKind = (typeof IMPORT_EXPORT_JOB_KINDS)[number];
export type ImportExportJobTarget = (typeof IMPORT_EXPORT_JOB_TARGETS)[number];
export type ImportExportJobStatus = (typeof IMPORT_EXPORT_JOB_STATUSES)[number];

export type ImportExportJob = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  kind: ImportExportJobKind;
  target: ImportExportJobTarget;
  status: ImportExportJobStatus;
  requestedBy?: string | null;
  sourceFilename?: string | null;
  sourceMimeType?: string | null;
  inputDigest?: string | null;
  outputUrl?: string | null;
  outputDigest?: string | null;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errorMessage?: string | null;
  metadata: Record<string, unknown>;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ImportExportJobInput = {
  key: string;
  label: string;
  description?: string | null;
  kind?: string | null;
  target?: string | null;
  status?: string | null;
  requestedBy?: string | null;
  sourceFilename?: string | null;
  sourceMimeType?: string | null;
  inputValue?: string | null;
  inputDigest?: string | null;
  outputUrl?: string | null;
  outputValue?: string | null;
  outputDigest?: string | null;
  totalRows?: number | string | null;
  processedRows?: number | string | null;
  failedRows?: number | string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | string | null;
};

export type ImportExportJobSummary = {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  attention: number;
  byKind: Record<ImportExportJobKind, number>;
  byTarget: Record<ImportExportJobTarget, number>;
  entries: ImportExportJob[];
};

export const DEFAULT_IMPORT_EXPORT_JOB: ImportExportJob = {
  id: 'import-export-job-default-products-export',
  key: 'products-export-template',
  label: 'Products export template',
  description: 'Default staged import/export job record for future product catalog export workflows.',
  kind: 'export',
  target: 'products',
  status: 'queued',
  requestedBy: 'system',
  sourceFilename: null,
  sourceMimeType: null,
  inputDigest: null,
  outputUrl: null,
  outputDigest: null,
  totalRows: 0,
  processedRows: 0,
  failedRows: 0,
  errorMessage: null,
  metadata: { foundation: true },
  startedAt: null,
  completedAt: null
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeImportExportJobKey(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || DEFAULT_IMPORT_EXPORT_JOB.key;
}

function normalizeEnum<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return allowed.includes(normalized as T) ? normalized as T : fallback;
}

export function normalizeImportExportJobKind(value?: string | null): ImportExportJobKind {
  return normalizeEnum(value, IMPORT_EXPORT_JOB_KINDS, DEFAULT_IMPORT_EXPORT_JOB.kind);
}

export function normalizeImportExportJobTarget(value?: string | null): ImportExportJobTarget {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!normalized) return DEFAULT_IMPORT_EXPORT_JOB.target;
  if (IMPORT_EXPORT_JOB_TARGETS.includes(normalized as ImportExportJobTarget)) return normalized as ImportExportJobTarget;

  const tokens = normalized.split('_').filter(Boolean);
  const matchedTarget = IMPORT_EXPORT_JOB_TARGETS.find((target) => {
    if (tokens.includes(target)) return true;
    return tokens.some((token) => target.startsWith(token) || token.startsWith(target));
  });

  return matchedTarget ?? DEFAULT_IMPORT_EXPORT_JOB.target;
}

export function normalizeImportExportJobStatus(value?: string | null): ImportExportJobStatus {
  return normalizeEnum(value, IMPORT_EXPORT_JOB_STATUSES, DEFAULT_IMPORT_EXPORT_JOB.status);
}

export function normalizeImportExportRowCount(value?: number | string | null) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? 0), 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100000000, Math.trunc(parsed)));
}

export function digestImportExportValue(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  return createHash('sha256').update(raw).digest('hex');
}

export function normalizeImportExportDigest(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized && /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

export function normalizeImportExportUrl(value?: string | null) {
  const raw = optionalText(value);
  if (!raw) return null;
  if (raw.startsWith('/') || raw.startsWith('s3://') || raw.startsWith('gs://')) return raw;
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeImportExportMetadata(value?: Record<string, unknown> | string | null): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return value;
}

export function normalizeImportExportJobInput(input: ImportExportJobInput): ImportExportJobInput {
  const totalRows = normalizeImportExportRowCount(input.totalRows);
  const processedRows = Math.min(normalizeImportExportRowCount(input.processedRows), totalRows || normalizeImportExportRowCount(input.processedRows));
  const failedRows = Math.min(normalizeImportExportRowCount(input.failedRows), processedRows || normalizeImportExportRowCount(input.failedRows));

  return {
    key: normalizeImportExportJobKey(input.key),
    label: optionalText(input.label) ?? DEFAULT_IMPORT_EXPORT_JOB.label,
    description: optionalText(input.description),
    kind: normalizeImportExportJobKind(input.kind),
    target: normalizeImportExportJobTarget(input.target),
    status: normalizeImportExportJobStatus(input.status),
    requestedBy: optionalText(input.requestedBy),
    sourceFilename: optionalText(input.sourceFilename),
    sourceMimeType: optionalText(input.sourceMimeType),
    inputDigest: normalizeImportExportDigest(input.inputDigest) ?? digestImportExportValue(input.inputValue),
    outputUrl: normalizeImportExportUrl(input.outputUrl),
    outputDigest: normalizeImportExportDigest(input.outputDigest) ?? digestImportExportValue(input.outputValue),
    totalRows,
    processedRows,
    failedRows,
    errorMessage: optionalText(input.errorMessage),
    metadata: normalizeImportExportMetadata(input.metadata)
  };
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === 'string') return normalizeImportExportMetadata(value);
  return {};
}

function mapImportExportJob(row: ImportExportJob): ImportExportJob {
  return {
    ...row,
    kind: normalizeImportExportJobKind(row.kind),
    target: normalizeImportExportJobTarget(row.target),
    status: normalizeImportExportJobStatus(row.status),
    totalRows: normalizeImportExportRowCount(row.totalRows),
    processedRows: normalizeImportExportRowCount(row.processedRows),
    failedRows: normalizeImportExportRowCount(row.failedRows),
    metadata: parseMetadata(row.metadata),
    inputDigest: normalizeImportExportDigest(row.inputDigest),
    outputDigest: normalizeImportExportDigest(row.outputDigest),
    outputUrl: normalizeImportExportUrl(row.outputUrl)
  };
}

export function buildImportExportJobSummary(entries: ImportExportJob[]): ImportExportJobSummary {
  const sortedEntries = [...entries].map(mapImportExportJob).sort((a, b) => {
    const aTime = a.createdAt?.getTime() ?? 0;
    const bTime = b.createdAt?.getTime() ?? 0;
    if (a.status !== b.status) return statusPriority(a.status) - statusPriority(b.status);
    if (aTime !== bTime) return bTime - aTime;
    return a.label.localeCompare(b.label);
  });
  const byKind = Object.fromEntries(IMPORT_EXPORT_JOB_KINDS.map((kind) => [kind, 0])) as Record<ImportExportJobKind, number>;
  const byTarget = Object.fromEntries(IMPORT_EXPORT_JOB_TARGETS.map((target) => [target, 0])) as Record<ImportExportJobTarget, number>;
  for (const entry of sortedEntries) {
    byKind[entry.kind] += 1;
    byTarget[entry.target] += 1;
  }

  return {
    total: sortedEntries.length,
    queued: sortedEntries.filter((entry) => entry.status === 'queued').length,
    running: sortedEntries.filter((entry) => entry.status === 'running').length,
    completed: sortedEntries.filter((entry) => entry.status === 'completed').length,
    failed: sortedEntries.filter((entry) => entry.status === 'failed').length,
    attention: sortedEntries.filter((entry) => ['failed', 'completed_with_errors'].includes(entry.status) || entry.failedRows > 0).length,
    byKind,
    byTarget,
    entries: sortedEntries
  };
}

function statusPriority(status: ImportExportJobStatus) {
  switch (status) {
    case 'running':
      return 0;
    case 'queued':
      return 1;
    case 'completed_with_errors':
    case 'failed':
      return 2;
    case 'completed':
      return 3;
    case 'cancelled':
      return 4;
    default:
      return 5;
  }
}

export const importExportJobTrackingService = {
  async list(limit = 10): Promise<ImportExportJob[]> {
    if (!hasDatabase()) return [DEFAULT_IMPORT_EXPORT_JOB];

    const rows = await prisma.$queryRaw<ImportExportJob[]>`
      SELECT "id", "key", "label", "description", "kind", "target", "status", "requestedBy", "sourceFilename", "sourceMimeType", "inputDigest", "outputUrl", "outputDigest", "totalRows", "processedRows", "failedRows", "errorMessage", "metadata", "startedAt", "completedAt", "createdAt", "updatedAt"
      FROM "ImportExportJob"
      ORDER BY "createdAt" DESC
      LIMIT ${Math.max(1, Math.min(50, Math.trunc(limit)))}
    `;

    return rows.length ? rows.map(mapImportExportJob) : [DEFAULT_IMPORT_EXPORT_JOB];
  },

  async summary(limit = 10): Promise<ImportExportJobSummary> {
    return buildImportExportJobSummary(await this.list(limit));
  },

  async upsert(input: ImportExportJobInput): Promise<ImportExportJob> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeImportExportJobInput(input);
    const rows = await prisma.$queryRaw<ImportExportJob[]>`
      INSERT INTO "ImportExportJob" ("key", "label", "description", "kind", "target", "status", "requestedBy", "sourceFilename", "sourceMimeType", "inputDigest", "outputUrl", "outputDigest", "totalRows", "processedRows", "failedRows", "errorMessage", "metadata", "startedAt", "completedAt")
      VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.kind}, ${normalized.target}, ${normalized.status}, ${normalized.requestedBy}, ${normalized.sourceFilename}, ${normalized.sourceMimeType}, ${normalized.inputDigest}, ${normalized.outputUrl}, ${normalized.outputDigest}, ${normalized.totalRows}, ${normalized.processedRows}, ${normalized.failedRows}, ${normalized.errorMessage}, ${JSON.stringify(normalized.metadata)}::jsonb, ${normalized.status === 'running' ? new Date() : null}, ${['completed', 'completed_with_errors', 'failed', 'cancelled'].includes(String(normalized.status)) ? new Date() : null})
      ON CONFLICT ("key") DO UPDATE SET
        "label" = EXCLUDED."label",
        "description" = EXCLUDED."description",
        "kind" = EXCLUDED."kind",
        "target" = EXCLUDED."target",
        "status" = EXCLUDED."status",
        "requestedBy" = EXCLUDED."requestedBy",
        "sourceFilename" = EXCLUDED."sourceFilename",
        "sourceMimeType" = EXCLUDED."sourceMimeType",
        "inputDigest" = EXCLUDED."inputDigest",
        "outputUrl" = EXCLUDED."outputUrl",
        "outputDigest" = EXCLUDED."outputDigest",
        "totalRows" = EXCLUDED."totalRows",
        "processedRows" = EXCLUDED."processedRows",
        "failedRows" = EXCLUDED."failedRows",
        "errorMessage" = EXCLUDED."errorMessage",
        "metadata" = EXCLUDED."metadata",
        "startedAt" = COALESCE("ImportExportJob"."startedAt", EXCLUDED."startedAt"),
        "completedAt" = EXCLUDED."completedAt",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "key", "label", "description", "kind", "target", "status", "requestedBy", "sourceFilename", "sourceMimeType", "inputDigest", "outputUrl", "outputDigest", "totalRows", "processedRows", "failedRows", "errorMessage", "metadata", "startedAt", "completedAt", "createdAt", "updatedAt"
    `;
    const job = mapImportExportJob(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.import_export_job.upsert',
      entity: 'importExportJob',
      entityId: job.id,
      summary: `Updated import/export job tracking record: ${job.label}`,
      metadata: {
        key: job.key,
        kind: job.kind,
        target: job.target,
        status: job.status,
        requestedBy: job.requestedBy,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        failedRows: job.failedRows,
        hasInputDigest: Boolean(job.inputDigest),
        hasOutputDigest: Boolean(job.outputDigest)
      }
    });

    return job;
  }
};
