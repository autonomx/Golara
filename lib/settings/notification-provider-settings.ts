import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { ADMIN_ORDER_NOTIFICATION_CHANNELS } from '@/lib/checkout/admin-order-notification-repository';
import { hasDatabase, prisma } from '@/lib/prisma';

export const NOTIFICATION_EMAIL_PROVIDERS = ['manual', 'smtp', 'resend', 'sendgrid'] as const;
export const NOTIFICATION_SMS_PROVIDERS = ['manual', 'twilio'] as const;

export type NotificationEmailProvider = (typeof NOTIFICATION_EMAIL_PROVIDERS)[number];
export type NotificationSmsProvider = (typeof NOTIFICATION_SMS_PROVIDERS)[number];

export type NotificationProviderReadinessIssue = {
  code: string;
  severity: 'blocker' | 'warning';
  summary: string;
  detail: string;
};

export type NotificationProviderSetting = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  emailProvider: NotificationEmailProvider;
  smsProvider: NotificationSmsProvider;
  defaultFromEmail?: string | null;
  defaultFromPhone?: string | null;
  replyToEmail?: string | null;
  enableOrderEmail: boolean;
  enableOrderSms: boolean;
  requireEmailProviderEnv: boolean;
  requireSmsProviderEnv: boolean;
  isDefault: boolean;
  isActive: boolean;
  updatedAt?: Date;
};

export type NotificationProviderSettingInput = {
  key: string;
  label: string;
  description?: string | null;
  emailProvider: string;
  smsProvider: string;
  defaultFromEmail?: string | null;
  defaultFromPhone?: string | null;
  replyToEmail?: string | null;
  enableOrderEmail: boolean;
  enableOrderSms: boolean;
  requireEmailProviderEnv: boolean;
  requireSmsProviderEnv: boolean;
  isDefault: boolean;
  isActive: boolean;
};

export type NotificationProviderReadinessSummary = {
  ready: boolean;
  settingKey: string;
  active: boolean;
  channels: string[];
  providers: string[];
  requiredEnvironmentVariables: string[];
  blockers: NotificationProviderReadinessIssue[];
  warnings: NotificationProviderReadinessIssue[];
};

export const DEFAULT_NOTIFICATION_PROVIDER_SETTING: NotificationProviderSetting = {
  id: 'notification-provider-default-readiness',
  key: 'default-notification-readiness',
  label: 'Default notification readiness',
  description: 'Admin-managed notification provider readiness settings. Provider secrets remain environment-managed.',
  emailProvider: 'manual',
  smsProvider: 'manual',
  defaultFromEmail: null,
  defaultFromPhone: null,
  replyToEmail: null,
  enableOrderEmail: true,
  enableOrderSms: false,
  requireEmailProviderEnv: false,
  requireSmsProviderEnv: false,
  isDefault: true,
  isActive: true
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeSlug(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || DEFAULT_NOTIFICATION_PROVIDER_SETTING.key;
}

function normalizeEnum<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  const normalized = value?.trim().toLowerCase();
  return allowed.find((item) => item.toLowerCase() === normalized) ?? fallback;
}

function hasEnv(env: Record<string, string | undefined>, name: string) {
  return Boolean(env[name]?.trim());
}

export function normalizeNotificationProviderSettingInput(input: NotificationProviderSettingInput): NotificationProviderSettingInput {
  return {
    key: normalizeSlug(input.key),
    label: optionalText(input.label) ?? DEFAULT_NOTIFICATION_PROVIDER_SETTING.label,
    description: optionalText(input.description),
    emailProvider: normalizeEnum(input.emailProvider, NOTIFICATION_EMAIL_PROVIDERS, DEFAULT_NOTIFICATION_PROVIDER_SETTING.emailProvider),
    smsProvider: normalizeEnum(input.smsProvider, NOTIFICATION_SMS_PROVIDERS, DEFAULT_NOTIFICATION_PROVIDER_SETTING.smsProvider),
    defaultFromEmail: optionalText(input.defaultFromEmail),
    defaultFromPhone: optionalText(input.defaultFromPhone),
    replyToEmail: optionalText(input.replyToEmail),
    enableOrderEmail: input.enableOrderEmail,
    enableOrderSms: input.enableOrderSms,
    requireEmailProviderEnv: input.requireEmailProviderEnv,
    requireSmsProviderEnv: input.requireSmsProviderEnv,
    isDefault: input.isDefault,
    isActive: input.isActive
  };
}

export function listRequiredNotificationProviderEnvironmentVariables(setting: NotificationProviderSetting) {
  const required = new Set<string>();

  if (setting.requireEmailProviderEnv || setting.emailProvider === 'smtp') {
    if (setting.emailProvider === 'smtp') {
      required.add('SMTP_HOST');
      required.add('SMTP_USER');
      required.add('SMTP_PASSWORD');
    }
  }
  if (setting.emailProvider === 'resend') required.add('RESEND_API_KEY');
  if (setting.emailProvider === 'sendgrid') required.add('SENDGRID_API_KEY');

  if (setting.requireSmsProviderEnv || setting.smsProvider === 'twilio') {
    if (setting.smsProvider === 'twilio') {
      required.add('TWILIO_ACCOUNT_SID');
      required.add('TWILIO_AUTH_TOKEN');
      required.add('TWILIO_FROM_NUMBER');
    }
  }

  return Array.from(required).sort();
}

export function buildNotificationProviderReadinessSummary(setting: NotificationProviderSetting, env: Record<string, string | undefined>): NotificationProviderReadinessSummary {
  const blockers: NotificationProviderReadinessIssue[] = [];
  const warnings: NotificationProviderReadinessIssue[] = [];
  const requiredEnvironmentVariables = listRequiredNotificationProviderEnvironmentVariables(setting);
  const channels = ADMIN_ORDER_NOTIFICATION_CHANNELS.filter((channel) => channel === 'email' ? setting.enableOrderEmail : setting.enableOrderSms);
  const providers = Array.from(new Set([setting.emailProvider, setting.smsProvider]));

  for (const name of requiredEnvironmentVariables) {
    if (!hasEnv(env, name)) {
      blockers.push({
        code: `${name.toLowerCase()}_missing`,
        severity: 'blocker',
        summary: `${name} is missing.`,
        detail: `Set ${name} before enabling this notification provider for live delivery.`
      });
    }
  }

  if (!setting.isActive) {
    warnings.push({
      code: 'notification_settings_inactive',
      severity: 'warning',
      summary: 'Notification provider setting is inactive.',
      detail: 'Queued notification actions can still exist, but this setting is not marked active.'
    });
  }

  if (setting.enableOrderEmail && setting.emailProvider === 'manual') {
    warnings.push({
      code: 'email_manual_provider',
      severity: 'warning',
      summary: 'Order email remains manual.',
      detail: 'Email notification actions are tracked, but automated email delivery is not configured.'
    });
  }

  if (setting.enableOrderSms && setting.smsProvider === 'manual') {
    warnings.push({
      code: 'sms_manual_provider',
      severity: 'warning',
      summary: 'Order SMS remains manual.',
      detail: 'SMS notification actions are tracked, but automated SMS delivery is not configured.'
    });
  }

  if (!setting.enableOrderEmail && !setting.enableOrderSms) {
    warnings.push({
      code: 'order_notifications_disabled',
      severity: 'warning',
      summary: 'Order notifications are disabled.',
      detail: 'No order notification channel is active for staff workflows.'
    });
  }

  return {
    ready: setting.isActive && blockers.length === 0,
    settingKey: setting.key,
    active: setting.isActive,
    channels,
    providers,
    requiredEnvironmentVariables,
    blockers,
    warnings
  };
}

function mapNotificationProviderSetting(row: NotificationProviderSetting): NotificationProviderSetting {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    emailProvider: row.emailProvider,
    smsProvider: row.smsProvider,
    defaultFromEmail: row.defaultFromEmail ?? null,
    defaultFromPhone: row.defaultFromPhone ?? null,
    replyToEmail: row.replyToEmail ?? null,
    enableOrderEmail: row.enableOrderEmail,
    enableOrderSms: row.enableOrderSms,
    requireEmailProviderEnv: row.requireEmailProviderEnv,
    requireSmsProviderEnv: row.requireSmsProviderEnv,
    isDefault: row.isDefault,
    isActive: row.isActive,
    updatedAt: row.updatedAt
  };
}

export const notificationProviderSettingsService = {
  async list(): Promise<NotificationProviderSetting[]> {
    if (!hasDatabase()) return [DEFAULT_NOTIFICATION_PROVIDER_SETTING];

    const rows = await prisma.$queryRaw<NotificationProviderSetting[]>`
      SELECT "id", "key", "label", "description", "emailProvider", "smsProvider", "defaultFromEmail", "defaultFromPhone", "replyToEmail", "enableOrderEmail", "enableOrderSms", "requireEmailProviderEnv", "requireSmsProviderEnv", "isDefault", "isActive", "updatedAt"
      FROM "NotificationProviderSetting"
      ORDER BY "isDefault" DESC, "label" ASC
    `;

    return rows.length ? rows.map(mapNotificationProviderSetting) : [DEFAULT_NOTIFICATION_PROVIDER_SETTING];
  },

  async update(input: NotificationProviderSettingInput): Promise<NotificationProviderSetting> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeNotificationProviderSettingInput(input);
    if (normalized.isDefault) {
      await prisma.$executeRaw`
        UPDATE "NotificationProviderSetting"
        SET "isDefault" = false, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "key" <> ${normalized.key}
      `;
    }

    const rows = await prisma.$queryRaw<NotificationProviderSetting[]>`
      INSERT INTO "NotificationProviderSetting" ("key", "label", "description", "emailProvider", "smsProvider", "defaultFromEmail", "defaultFromPhone", "replyToEmail", "enableOrderEmail", "enableOrderSms", "requireEmailProviderEnv", "requireSmsProviderEnv", "isDefault", "isActive")
      VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.emailProvider}, ${normalized.smsProvider}, ${normalized.defaultFromEmail}, ${normalized.defaultFromPhone}, ${normalized.replyToEmail}, ${normalized.enableOrderEmail}, ${normalized.enableOrderSms}, ${normalized.requireEmailProviderEnv}, ${normalized.requireSmsProviderEnv}, ${normalized.isDefault}, ${normalized.isActive})
      ON CONFLICT ("key") DO UPDATE SET
        "label" = EXCLUDED."label",
        "description" = EXCLUDED."description",
        "emailProvider" = EXCLUDED."emailProvider",
        "smsProvider" = EXCLUDED."smsProvider",
        "defaultFromEmail" = EXCLUDED."defaultFromEmail",
        "defaultFromPhone" = EXCLUDED."defaultFromPhone",
        "replyToEmail" = EXCLUDED."replyToEmail",
        "enableOrderEmail" = EXCLUDED."enableOrderEmail",
        "enableOrderSms" = EXCLUDED."enableOrderSms",
        "requireEmailProviderEnv" = EXCLUDED."requireEmailProviderEnv",
        "requireSmsProviderEnv" = EXCLUDED."requireSmsProviderEnv",
        "isDefault" = EXCLUDED."isDefault",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "key", "label", "description", "emailProvider", "smsProvider", "defaultFromEmail", "defaultFromPhone", "replyToEmail", "enableOrderEmail", "enableOrderSms", "requireEmailProviderEnv", "requireSmsProviderEnv", "isDefault", "isActive", "updatedAt"
    `;
    const setting = mapNotificationProviderSetting(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.notification_provider.update',
      entity: 'notificationProviderSetting',
      entityId: setting.id,
      summary: `Updated notification provider setting: ${setting.label}`,
      metadata: {
        key: setting.key,
        emailProvider: setting.emailProvider,
        smsProvider: setting.smsProvider,
        enableOrderEmail: setting.enableOrderEmail,
        enableOrderSms: setting.enableOrderSms,
        requiredEnvironmentVariables: listRequiredNotificationProviderEnvironmentVariables(setting),
        isDefault: setting.isDefault,
        isActive: setting.isActive
      }
    });

    return setting;
  }
};
