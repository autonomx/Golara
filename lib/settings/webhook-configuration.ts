import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

export type WebhookReadinessIssue = {
  code: string;
  severity: 'blocker' | 'warning';
  summary: string;
  detail: string;
};

export type WebhookConfiguration = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  targetUrl: string;
  events: string[];
  secretEnvVar?: string | null;
  headerNames: string[];
  isDefault: boolean;
  isActive: boolean;
  updatedAt?: Date;
};

export type WebhookConfigurationInput = {
  key: string;
  label: string;
  description?: string | null;
  targetUrl: string;
  events: string[] | string;
  secretEnvVar?: string | null;
  headerNames?: string[] | string | null;
  isDefault: boolean;
  isActive: boolean;
};

export type WebhookReadinessSummary = {
  ready: boolean;
  settingKey: string;
  active: boolean;
  targetUrl: string;
  events: string[];
  secretEnvVar?: string | null;
  headerNames: string[];
  blockers: WebhookReadinessIssue[];
  warnings: WebhookReadinessIssue[];
};

export const DEFAULT_WEBHOOK_CONFIGURATION: WebhookConfiguration = {
  id: 'webhook-configuration-default-readiness',
  key: 'default-webhook-configuration',
  label: 'Default webhook configuration',
  description: 'Admin-managed webhook target and event subscription foundation. Secrets remain environment-managed.',
  targetUrl: 'https://example.com/webhooks/golara',
  events: ['order.created', 'order.updated'],
  secretEnvVar: 'GOLARA_WEBHOOK_SECRET',
  headerNames: ['x-golara-signature'],
  isDefault: true,
  isActive: false
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeWebhookKey(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || DEFAULT_WEBHOOK_CONFIGURATION.key;
}

export function normalizeWebhookTargetUrl(value?: string | null) {
  const raw = optionalText(value);
  if (!raw) return DEFAULT_WEBHOOK_CONFIGURATION.targetUrl;

  try {
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol)) return DEFAULT_WEBHOOK_CONFIGURATION.targetUrl;
    url.hash = '';
    return url.toString();
  } catch {
    return DEFAULT_WEBHOOK_CONFIGURATION.targetUrl;
  }
}

export function isWebhookTargetUrlValid(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function normalizeWebhookEventName(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9:._-]+/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  if (!normalized.includes('.')) return null;
  return normalized;
}

export function normalizeWebhookEvents(values: string[] | string) {
  const rawValues = Array.isArray(values) ? values : values.split(/[\n,]+/g);
  return Array.from(new Set(rawValues.map(normalizeWebhookEventName).filter(Boolean) as string[])).sort();
}

export function normalizeWebhookHeaderName(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(normalized)) return null;
  return normalized;
}

export function normalizeWebhookHeaderNames(values?: string[] | string | null) {
  if (!values) return DEFAULT_WEBHOOK_CONFIGURATION.headerNames;
  const rawValues = Array.isArray(values) ? values : values.split(/[\n,]+/g);
  const normalized = Array.from(new Set(rawValues.map(normalizeWebhookHeaderName).filter(Boolean) as string[])).sort();
  return normalized.length ? normalized : DEFAULT_WEBHOOK_CONFIGURATION.headerNames;
}

export function normalizeWebhookSecretEnvVar(value?: string | null) {
  const normalized = optionalText(value)?.toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized || null;
}

export function normalizeWebhookConfigurationInput(input: WebhookConfigurationInput): WebhookConfigurationInput {
  const events = normalizeWebhookEvents(input.events);
  return {
    key: normalizeWebhookKey(input.key),
    label: optionalText(input.label) ?? DEFAULT_WEBHOOK_CONFIGURATION.label,
    description: optionalText(input.description),
    targetUrl: normalizeWebhookTargetUrl(input.targetUrl),
    events: events.length ? events : DEFAULT_WEBHOOK_CONFIGURATION.events,
    secretEnvVar: normalizeWebhookSecretEnvVar(input.secretEnvVar),
    headerNames: normalizeWebhookHeaderNames(input.headerNames),
    isDefault: input.isDefault,
    isActive: input.isActive
  };
}

export function buildWebhookReadinessSummary(setting: WebhookConfiguration, env: Record<string, string | undefined>): WebhookReadinessSummary {
  const blockers: WebhookReadinessIssue[] = [];
  const warnings: WebhookReadinessIssue[] = [];

  if (!isWebhookTargetUrlValid(setting.targetUrl)) {
    blockers.push({
      code: 'webhook_target_url_invalid',
      severity: 'blocker',
      summary: 'Webhook target URL must use HTTPS for live delivery.',
      detail: 'Use an HTTPS target URL, except localhost targets for local development.'
    });
  }

  if (setting.events.length === 0) {
    blockers.push({
      code: 'webhook_events_missing',
      severity: 'blocker',
      summary: 'Webhook has no subscribed events.',
      detail: 'Add at least one event such as order.created or order.updated.'
    });
  }

  if (setting.secretEnvVar && !env[setting.secretEnvVar]?.trim()) {
    warnings.push({
      code: 'webhook_secret_env_missing',
      severity: 'warning',
      summary: `${setting.secretEnvVar} is not configured.`,
      detail: 'Set the environment variable before relying on signed webhook delivery.'
    });
  }

  if (!setting.secretEnvVar) {
    warnings.push({
      code: 'webhook_secret_env_not_set',
      severity: 'warning',
      summary: 'Webhook signing secret environment variable is not named.',
      detail: 'Configure a secret environment variable name so delivery code can sign payloads without storing secrets in admin settings.'
    });
  }

  if (!setting.isActive) {
    warnings.push({
      code: 'webhook_configuration_inactive',
      severity: 'warning',
      summary: 'Webhook configuration is inactive.',
      detail: 'The webhook target is stored for readiness, but outgoing delivery should not use it until active.'
    });
  }

  return {
    ready: setting.isActive && blockers.length === 0,
    settingKey: setting.key,
    active: setting.isActive,
    targetUrl: setting.targetUrl,
    events: setting.events,
    secretEnvVar: setting.secretEnvVar ?? null,
    headerNames: setting.headerNames,
    blockers,
    warnings
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

function mapWebhookConfiguration(row: Omit<WebhookConfiguration, 'events' | 'headerNames'> & { events: unknown; headerNames: unknown }): WebhookConfiguration {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    targetUrl: row.targetUrl,
    events: normalizeWebhookEvents(parseStringArray(row.events)),
    secretEnvVar: row.secretEnvVar ?? null,
    headerNames: normalizeWebhookHeaderNames(parseStringArray(row.headerNames)),
    isDefault: row.isDefault,
    isActive: row.isActive,
    updatedAt: row.updatedAt
  };
}

export const webhookConfigurationService = {
  async list(): Promise<WebhookConfiguration[]> {
    if (!hasDatabase()) return [DEFAULT_WEBHOOK_CONFIGURATION];

    const rows = await prisma.$queryRaw<(Omit<WebhookConfiguration, 'events' | 'headerNames'> & { events: unknown; headerNames: unknown })[]>`
      SELECT "id", "key", "label", "description", "targetUrl", "events", "secretEnvVar", "headerNames", "isDefault", "isActive", "updatedAt"
      FROM "WebhookConfiguration"
      ORDER BY "isDefault" DESC, "label" ASC
    `;

    return rows.length ? rows.map(mapWebhookConfiguration) : [DEFAULT_WEBHOOK_CONFIGURATION];
  },

  async update(input: WebhookConfigurationInput): Promise<WebhookConfiguration> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeWebhookConfigurationInput(input);
    if (normalized.isDefault) {
      await prisma.$executeRaw`
        UPDATE "WebhookConfiguration"
        SET "isDefault" = false, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "key" <> ${normalized.key}
      `;
    }

    const rows = await prisma.$queryRaw<(Omit<WebhookConfiguration, 'events' | 'headerNames'> & { events: unknown; headerNames: unknown })[]>`
      INSERT INTO "WebhookConfiguration" ("key", "label", "description", "targetUrl", "events", "secretEnvVar", "headerNames", "isDefault", "isActive")
      VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.targetUrl}, ${JSON.stringify(normalized.events)}::jsonb, ${normalized.secretEnvVar}, ${JSON.stringify(normalized.headerNames)}::jsonb, ${normalized.isDefault}, ${normalized.isActive})
      ON CONFLICT ("key") DO UPDATE SET
        "label" = EXCLUDED."label",
        "description" = EXCLUDED."description",
        "targetUrl" = EXCLUDED."targetUrl",
        "events" = EXCLUDED."events",
        "secretEnvVar" = EXCLUDED."secretEnvVar",
        "headerNames" = EXCLUDED."headerNames",
        "isDefault" = EXCLUDED."isDefault",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "key", "label", "description", "targetUrl", "events", "secretEnvVar", "headerNames", "isDefault", "isActive", "updatedAt"
    `;
    const setting = mapWebhookConfiguration(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.webhook_configuration.update',
      entity: 'webhookConfiguration',
      entityId: setting.id,
      summary: `Updated webhook configuration: ${setting.label}`,
      metadata: {
        key: setting.key,
        targetUrl: setting.targetUrl,
        events: setting.events,
        secretEnvVar: setting.secretEnvVar,
        headerNames: setting.headerNames,
        isDefault: setting.isDefault,
        isActive: setting.isActive
      }
    });

    return setting;
  }
};
