import 'server-only';

import { createHash } from 'node:crypto';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';
import { DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY, normalizeIntegrationAppKey, normalizeIntegrationPermissionList } from '@/lib/settings/integration-app-registry';

export type ApiTokenCredential = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  tokenPrefix?: string | null;
  tokenDigest?: string | null;
  scopes: string[];
  integrationAppKey?: string | null;
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  isRevoked: boolean;
  isActive: boolean;
  updatedAt?: Date;
};

export type ApiTokenCredentialInput = {
  key: string;
  label: string;
  description?: string | null;
  tokenValue?: string | null;
  tokenPrefix?: string | null;
  scopes?: string[] | string | null;
  integrationAppKey?: string | null;
  expiresAt?: Date | string | null;
  isRevoked: boolean;
  isActive: boolean;
};

export type ApiTokenManagementSummary = {
  total: number;
  active: number;
  revoked: number;
  expired: number;
  expiringSoon: number;
  entries: ApiTokenCredential[];
};

export const DEFAULT_API_TOKEN_CREDENTIAL: ApiTokenCredential = {
  id: 'api-token-default-internal',
  key: 'default-internal-api-token',
  label: 'Default internal API token placeholder',
  description: 'Metadata-only placeholder for future API token issuance. Secret token values are never stored in admin settings.',
  tokenPrefix: 'golara_live',
  tokenDigest: null,
  scopes: ['admin:read', 'webhooks:read'],
  integrationAppKey: DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.key,
  expiresAt: null,
  lastUsedAt: null,
  isRevoked: false,
  isActive: false
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeApiTokenKey(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || DEFAULT_API_TOKEN_CREDENTIAL.key;
}

export function normalizeApiTokenPrefix(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32);
  return normalized || null;
}

export function createApiTokenDigest(tokenValue?: string | null) {
  const token = tokenValue?.trim();
  if (!token) return null;
  return createHash('sha256').update(token).digest('hex');
}

export function deriveApiTokenPrefix(tokenValue?: string | null, fallback?: string | null) {
  const token = tokenValue?.trim();
  if (token) return normalizeApiTokenPrefix(token.split(/[._-]/g).slice(0, 2).join('_')) ?? normalizeApiTokenPrefix(token.slice(0, 12));
  return normalizeApiTokenPrefix(fallback);
}

function normalizeDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeApiTokenCredentialInput(input: ApiTokenCredentialInput): Omit<ApiTokenCredential, 'id' | 'lastUsedAt' | 'updatedAt'> {
  return {
    key: normalizeApiTokenKey(input.key),
    label: optionalText(input.label) ?? DEFAULT_API_TOKEN_CREDENTIAL.label,
    description: optionalText(input.description),
    tokenPrefix: deriveApiTokenPrefix(input.tokenValue, input.tokenPrefix),
    tokenDigest: createApiTokenDigest(input.tokenValue),
    scopes: normalizeIntegrationPermissionList(input.scopes),
    integrationAppKey: input.integrationAppKey ? normalizeIntegrationAppKey(input.integrationAppKey) : null,
    expiresAt: normalizeDate(input.expiresAt),
    isRevoked: input.isRevoked,
    isActive: input.isActive
  };
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return value.split(/[\n,]+/g);
    }
  }
  return [];
}

function mapApiTokenCredential(row: Omit<ApiTokenCredential, 'scopes'> & { scopes: unknown }): ApiTokenCredential {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    tokenPrefix: row.tokenPrefix ?? null,
    tokenDigest: row.tokenDigest ?? null,
    scopes: normalizeIntegrationPermissionList(parseStringArray(row.scopes)),
    integrationAppKey: row.integrationAppKey ?? null,
    expiresAt: row.expiresAt ?? null,
    lastUsedAt: row.lastUsedAt ?? null,
    isRevoked: row.isRevoked,
    isActive: row.isActive,
    updatedAt: row.updatedAt
  };
}

export function buildApiTokenManagementSummary(entries: ApiTokenCredential[], now = new Date()): ApiTokenManagementSummary {
  const soon = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);
  return {
    total: entries.length,
    active: entries.filter((entry) => entry.isActive && !entry.isRevoked).length,
    revoked: entries.filter((entry) => entry.isRevoked).length,
    expired: entries.filter((entry) => entry.expiresAt ? entry.expiresAt <= now : false).length,
    expiringSoon: entries.filter((entry) => entry.expiresAt ? entry.expiresAt > now && entry.expiresAt <= soon : false).length,
    entries
  };
}

export const apiTokenManagementService = {
  async list(): Promise<ApiTokenCredential[]> {
    if (!hasDatabase()) return [DEFAULT_API_TOKEN_CREDENTIAL];

    const rows = await prisma.$queryRaw<(Omit<ApiTokenCredential, 'scopes'> & { scopes: unknown })[]>`
      SELECT "id", "key", "label", "description", "tokenPrefix", "tokenDigest", "scopes", "integrationAppKey", "expiresAt", "lastUsedAt", "isRevoked", "isActive", "updatedAt"
      FROM "ApiTokenCredential"
      ORDER BY "isActive" DESC, "label" ASC
    `;

    return rows.length ? rows.map(mapApiTokenCredential) : [DEFAULT_API_TOKEN_CREDENTIAL];
  },

  async summary(): Promise<ApiTokenManagementSummary> {
    return buildApiTokenManagementSummary(await this.list());
  },

  async update(input: ApiTokenCredentialInput): Promise<ApiTokenCredential> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeApiTokenCredentialInput(input);
    const existingRows = await prisma.$queryRaw<{ tokenDigest: string | null; tokenPrefix: string | null }[]>`
      SELECT "tokenDigest", "tokenPrefix"
      FROM "ApiTokenCredential"
      WHERE "key" = ${normalized.key}
      LIMIT 1
    `;
    const existing = existingRows[0];
    const tokenDigest = normalized.tokenDigest ?? existing?.tokenDigest ?? null;
    const tokenPrefix = normalized.tokenPrefix ?? existing?.tokenPrefix ?? null;

    const rows = await prisma.$queryRaw<(Omit<ApiTokenCredential, 'scopes'> & { scopes: unknown })[]>`
      INSERT INTO "ApiTokenCredential" ("key", "label", "description", "tokenPrefix", "tokenDigest", "scopes", "integrationAppKey", "expiresAt", "isRevoked", "isActive")
      VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${tokenPrefix}, ${tokenDigest}, ${JSON.stringify(normalized.scopes)}::jsonb, ${normalized.integrationAppKey}, ${normalized.expiresAt}, ${normalized.isRevoked}, ${normalized.isActive})
      ON CONFLICT ("key") DO UPDATE SET
        "label" = EXCLUDED."label",
        "description" = EXCLUDED."description",
        "tokenPrefix" = EXCLUDED."tokenPrefix",
        "tokenDigest" = EXCLUDED."tokenDigest",
        "scopes" = EXCLUDED."scopes",
        "integrationAppKey" = EXCLUDED."integrationAppKey",
        "expiresAt" = EXCLUDED."expiresAt",
        "isRevoked" = EXCLUDED."isRevoked",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "key", "label", "description", "tokenPrefix", "tokenDigest", "scopes", "integrationAppKey", "expiresAt", "lastUsedAt", "isRevoked", "isActive", "updatedAt"
    `;
    const credential = mapApiTokenCredential(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.api_token_management.update',
      entity: 'apiTokenCredential',
      entityId: credential.id,
      summary: `Updated API token metadata: ${credential.label}`,
      metadata: {
        key: credential.key,
        tokenPrefix: credential.tokenPrefix,
        hasTokenDigest: Boolean(credential.tokenDigest),
        scopes: credential.scopes,
        integrationAppKey: credential.integrationAppKey,
        expiresAt: credential.expiresAt?.toISOString() ?? null,
        isRevoked: credential.isRevoked,
        isActive: credential.isActive
      }
    });

    return credential;
  }
};
