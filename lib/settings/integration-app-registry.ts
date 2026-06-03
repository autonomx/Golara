import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';
import { DEFAULT_WEBHOOK_CONFIGURATION, normalizeWebhookKey, normalizeWebhookTargetUrl } from '@/lib/settings/webhook-configuration';

export const INTEGRATION_APP_CATEGORIES = ['webhook', 'payment', 'notification', 'shipping', 'analytics', 'cms', 'custom'] as const;
export const INTEGRATION_APP_STATUSES = ['planned', 'configured', 'active', 'disabled', 'needs_attention'] as const;

export type IntegrationAppCategory = (typeof INTEGRATION_APP_CATEGORIES)[number];
export type IntegrationAppStatus = (typeof INTEGRATION_APP_STATUSES)[number];

export type IntegrationAppRegistryEntry = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  category: IntegrationAppCategory;
  provider?: string | null;
  status: IntegrationAppStatus;
  homepageUrl?: string | null;
  docsUrl?: string | null;
  webhookConfigurationKey?: string | null;
  permissions: string[];
  requiredEnvVars: string[];
  isInternal: boolean;
  isActive: boolean;
  updatedAt?: Date;
};

export type IntegrationAppRegistryInput = {
  key: string;
  label: string;
  description?: string | null;
  category?: string | null;
  provider?: string | null;
  status?: string | null;
  homepageUrl?: string | null;
  docsUrl?: string | null;
  webhookConfigurationKey?: string | null;
  permissions?: string[] | string | null;
  requiredEnvVars?: string[] | string | null;
  isInternal: boolean;
  isActive: boolean;
};

export type IntegrationAppRegistrySummary = {
  total: number;
  active: number;
  internal: number;
  needsAttention: number;
  byCategory: Record<IntegrationAppCategory, number>;
  entries: IntegrationAppRegistryEntry[];
};

export const DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY: IntegrationAppRegistryEntry = {
  id: 'integration-app-default-webhook',
  key: 'default-webhook-app',
  label: 'Default webhook app',
  description: 'Placeholder integration registry entry for Golara webhook-based automations.',
  category: 'webhook',
  provider: 'golara',
  status: 'planned',
  homepageUrl: null,
  docsUrl: null,
  webhookConfigurationKey: DEFAULT_WEBHOOK_CONFIGURATION.key,
  permissions: ['webhooks:read', 'webhooks:write'],
  requiredEnvVars: ['GOLARA_WEBHOOK_SECRET'],
  isInternal: true,
  isActive: false
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeIntegrationAppKey(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.key;
}

function normalizeEnum<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return allowed.includes(normalized as T) ? normalized as T : fallback;
}

export function normalizeIntegrationAppCategory(value?: string | null): IntegrationAppCategory {
  return normalizeEnum(value, INTEGRATION_APP_CATEGORIES, DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.category);
}

export function normalizeIntegrationAppStatus(value?: string | null): IntegrationAppStatus {
  return normalizeEnum(value, INTEGRATION_APP_STATUSES, DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.status);
}

function normalizeUrl(value?: string | null) {
  const raw = optionalText(value);
  if (!raw) return null;
  const normalized = normalizeWebhookTargetUrl(raw);
  return normalized === DEFAULT_WEBHOOK_CONFIGURATION.targetUrl && raw !== DEFAULT_WEBHOOK_CONFIGURATION.targetUrl ? null : normalized;
}

export function normalizeIntegrationPermission(value: string) {
  const raw = value.trim().toLowerCase();
  if (!raw.includes(':')) return null;
  const normalized = raw.replace(/[^a-z0-9:_-]+/g, ':').replace(/:+/g, ':').replace(/^:|:$/g, '');
  if (!normalized.includes(':')) return null;
  return normalized;
}

export function normalizeIntegrationPermissionList(values?: string[] | string | null) {
  if (!values) return DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.permissions;
  const rawValues = Array.isArray(values) ? values : values.split(/[\n,]+/g);
  const normalized = Array.from(new Set(rawValues.map(normalizeIntegrationPermission).filter(Boolean) as string[])).sort();
  return normalized.length ? normalized : DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.permissions;
}

export function normalizeRequiredEnvVarName(value: string) {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized || null;
}

export function normalizeRequiredEnvVars(values?: string[] | string | null) {
  if (!values) return [];
  const rawValues = Array.isArray(values) ? values : values.split(/[\n,]+/g);
  return Array.from(new Set(rawValues.map(normalizeRequiredEnvVarName).filter(Boolean) as string[])).sort();
}

export function normalizeIntegrationAppRegistryInput(input: IntegrationAppRegistryInput): IntegrationAppRegistryInput {
  return {
    key: normalizeIntegrationAppKey(input.key),
    label: optionalText(input.label) ?? DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.label,
    description: optionalText(input.description),
    category: normalizeIntegrationAppCategory(input.category),
    provider: optionalText(input.provider),
    status: normalizeIntegrationAppStatus(input.status),
    homepageUrl: normalizeUrl(input.homepageUrl),
    docsUrl: normalizeUrl(input.docsUrl),
    webhookConfigurationKey: input.webhookConfigurationKey ? normalizeWebhookKey(input.webhookConfigurationKey) : null,
    permissions: normalizeIntegrationPermissionList(input.permissions),
    requiredEnvVars: normalizeRequiredEnvVars(input.requiredEnvVars),
    isInternal: input.isInternal,
    isActive: input.isActive
  };
}

export function buildIntegrationAppRegistrySummary(entries: IntegrationAppRegistryEntry[]): IntegrationAppRegistrySummary {
  const byCategory = Object.fromEntries(INTEGRATION_APP_CATEGORIES.map((category) => [category, 0])) as Record<IntegrationAppCategory, number>;
  let active = 0;
  let internal = 0;
  let needsAttention = 0;

  for (const entry of entries) {
    byCategory[entry.category] += 1;
    if (entry.isActive && entry.status === 'active') active += 1;
    if (entry.isInternal) internal += 1;
    if (entry.status === 'needs_attention') needsAttention += 1;
  }

  return {
    total: entries.length,
    active,
    internal,
    needsAttention,
    byCategory,
    entries: entries.slice().sort((a, b) => a.label.localeCompare(b.label))
  };
}

function mapIntegrationAppRegistryEntry(row: IntegrationAppRegistryEntry): IntegrationAppRegistryEntry {
  return {
    ...row,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    requiredEnvVars: Array.isArray(row.requiredEnvVars) ? row.requiredEnvVars : []
  };
}

export const integrationAppRegistryService = {
  async list(): Promise<IntegrationAppRegistryEntry[]> {
    if (!hasDatabase()) return [DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY];

    const rows = await prisma.$queryRaw<IntegrationAppRegistryEntry[]>`
      SELECT
        "id",
        "key",
        "label",
        "description",
        "category",
        "provider",
        "status",
        "homepageUrl",
        "docsUrl",
        "webhookConfigurationKey",
        "permissions",
        "requiredEnvVars",
        "isInternal",
        "isActive",
        "updatedAt"
      FROM "IntegrationAppRegistry"
      ORDER BY "label" ASC
    `;

    return rows.length ? rows.map(mapIntegrationAppRegistryEntry) : [DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY];
  },

  async summary(): Promise<IntegrationAppRegistrySummary> {
    return buildIntegrationAppRegistrySummary(await this.list());
  },

  async update(input: IntegrationAppRegistryInput): Promise<IntegrationAppRegistryEntry> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');
    const normalized = normalizeIntegrationAppRegistryInput(input);

    const rows = await prisma.$queryRaw<IntegrationAppRegistryEntry[]>`
      INSERT INTO "IntegrationAppRegistry" (
        "key", "label", "description", "category", "provider", "status", "homepageUrl", "docsUrl", "webhookConfigurationKey", "permissions", "requiredEnvVars", "isInternal", "isActive"
      ) VALUES (
        ${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.category}, ${normalized.provider}, ${normalized.status}, ${normalized.homepageUrl}, ${normalized.docsUrl}, ${normalized.webhookConfigurationKey}, ${normalized.permissions}, ${normalized.requiredEnvVars}, ${normalized.isInternal}, ${normalized.isActive}
      )
      ON CONFLICT ("key") DO UPDATE SET
        "label" = EXCLUDED."label",
        "description" = EXCLUDED."description",
        "category" = EXCLUDED."category",
        "provider" = EXCLUDED."provider",
        "status" = EXCLUDED."status",
        "homepageUrl" = EXCLUDED."homepageUrl",
        "docsUrl" = EXCLUDED."docsUrl",
        "webhookConfigurationKey" = EXCLUDED."webhookConfigurationKey",
        "permissions" = EXCLUDED."permissions",
        "requiredEnvVars" = EXCLUDED."requiredEnvVars",
        "isInternal" = EXCLUDED."isInternal",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "key", "label", "description", "category", "provider", "status", "homepageUrl", "docsUrl", "webhookConfigurationKey", "permissions", "requiredEnvVars", "isInternal", "isActive", "updatedAt"
    `;
    const entry = mapIntegrationAppRegistryEntry(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.integration_app_registry.update',
      entity: 'integrationAppRegistry',
      entityId: entry.id,
      summary: `Updated integration app: ${entry.label}`,
      metadata: {
        key: entry.key,
        category: entry.category,
        status: entry.status,
        isActive: entry.isActive
      }
    });

    return entry;
  }
};
