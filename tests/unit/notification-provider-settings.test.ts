import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_NOTIFICATION_PROVIDER_SETTING,
  buildNotificationProviderReadinessSummary,
  listRequiredNotificationProviderEnvironmentVariables,
  normalizeNotificationProviderSettingInput
} from '../../lib/settings/notification-provider-settings';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runNotificationProviderSettingsTests() {
  const migration = source('prisma/migrations/20260603060000_add_notification_provider_settings_readiness/migration.sql');
  const service = source('lib/settings/notification-provider-settings.ts');
  const panel = source('components/admin/AdminNotificationProviderSettingsPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "NotificationProviderSetting"/);
  assert.match(migration, /"emailProvider" TEXT NOT NULL DEFAULT 'manual'/);
  assert.match(migration, /"smsProvider" TEXT NOT NULL DEFAULT 'manual'/);
  assert.match(migration, /"enableOrderEmail" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"enableOrderSms" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"requireEmailProviderEnv" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"requireSmsProviderEnv" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /NotificationProviderSetting_key_key/);
  assert.match(migration, /NotificationProviderSetting_single_default_idx/);
  assert.match(migration, /'default-notification-readiness'/);

  assert.match(service, /NOTIFICATION_EMAIL_PROVIDERS = \['manual', 'smtp', 'resend', 'sendgrid'\] as const/);
  assert.match(service, /NOTIFICATION_SMS_PROVIDERS = \['manual', 'twilio'\] as const/);
  assert.match(service, /export type NotificationProviderSetting/);
  assert.match(service, /DEFAULT_NOTIFICATION_PROVIDER_SETTING/);
  assert.match(service, /normalizeNotificationProviderSettingInput/);
  assert.match(service, /listRequiredNotificationProviderEnvironmentVariables/);
  assert.match(service, /buildNotificationProviderReadinessSummary/);
  assert.match(service, /notificationProviderSettingsService = \{/);
  assert.match(service, /FROM "NotificationProviderSetting"/);
  assert.match(service, /INSERT INTO "NotificationProviderSetting"/);
  assert.match(service, /action: 'settings\.notification_provider\.update'/);

  assert.equal(DEFAULT_NOTIFICATION_PROVIDER_SETTING.key, 'default-notification-readiness');
  assert.equal(DEFAULT_NOTIFICATION_PROVIDER_SETTING.emailProvider, 'manual');
  assert.equal(DEFAULT_NOTIFICATION_PROVIDER_SETTING.smsProvider, 'manual');
  assert.equal(DEFAULT_NOTIFICATION_PROVIDER_SETTING.enableOrderEmail, true);
  assert.equal(DEFAULT_NOTIFICATION_PROVIDER_SETTING.enableOrderSms, false);

  const normalized = normalizeNotificationProviderSettingInput({
    key: ' Provider Readiness! ',
    label: '  Notification settings  ',
    description: '  Order notifications  ',
    emailProvider: ' resend ',
    smsProvider: ' twilio ',
    defaultFromEmail: ' orders@example.com ',
    defaultFromPhone: ' +15551234567 ',
    replyToEmail: ' support@example.com ',
    enableOrderEmail: true,
    enableOrderSms: true,
    requireEmailProviderEnv: true,
    requireSmsProviderEnv: true,
    isDefault: true,
    isActive: true
  });

  assert.equal(normalized.key, 'provider-readiness');
  assert.equal(normalized.label, 'Notification settings');
  assert.equal(normalized.description, 'Order notifications');
  assert.equal(normalized.emailProvider, 'resend');
  assert.equal(normalized.smsProvider, 'twilio');
  assert.equal(normalized.defaultFromEmail, 'orders@example.com');
  assert.equal(normalized.defaultFromPhone, '+15551234567');
  assert.equal(normalized.replyToEmail, 'support@example.com');

  const fallbackNormalized = normalizeNotificationProviderSettingInput({
    key: ' !!! ',
    label: '   ',
    description: '   ',
    emailProvider: 'mailgun',
    smsProvider: 'sms-unknown',
    defaultFromEmail: '   ',
    defaultFromPhone: null,
    replyToEmail: undefined,
    enableOrderEmail: false,
    enableOrderSms: false,
    requireEmailProviderEnv: false,
    requireSmsProviderEnv: false,
    isDefault: false,
    isActive: false
  });
  assert.equal(fallbackNormalized.key, DEFAULT_NOTIFICATION_PROVIDER_SETTING.key);
  assert.equal(fallbackNormalized.label, DEFAULT_NOTIFICATION_PROVIDER_SETTING.label);
  assert.equal(fallbackNormalized.description, null);
  assert.equal(fallbackNormalized.emailProvider, 'manual');
  assert.equal(fallbackNormalized.smsProvider, 'manual');
  assert.equal(fallbackNormalized.defaultFromEmail, null);
  assert.equal(fallbackNormalized.defaultFromPhone, null);
  assert.equal(fallbackNormalized.replyToEmail, null);

  const setting = {
    ...DEFAULT_NOTIFICATION_PROVIDER_SETTING,
    emailProvider: 'resend' as const,
    smsProvider: 'twilio' as const,
    enableOrderEmail: true,
    enableOrderSms: true,
    requireEmailProviderEnv: true,
    requireSmsProviderEnv: true
  };

  assert.deepEqual(listRequiredNotificationProviderEnvironmentVariables(setting), [
    'RESEND_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_NUMBER'
  ]);

  assert.deepEqual(listRequiredNotificationProviderEnvironmentVariables({
    ...DEFAULT_NOTIFICATION_PROVIDER_SETTING,
    emailProvider: 'smtp',
    smsProvider: 'manual',
    requireEmailProviderEnv: false,
    requireSmsProviderEnv: true
  }), ['SMTP_HOST', 'SMTP_PASSWORD', 'SMTP_USER']);

  assert.deepEqual(listRequiredNotificationProviderEnvironmentVariables({
    ...DEFAULT_NOTIFICATION_PROVIDER_SETTING,
    emailProvider: 'sendgrid',
    smsProvider: 'manual'
  }), ['SENDGRID_API_KEY']);

  const blockedReadiness = buildNotificationProviderReadinessSummary(setting, {});
  assert.equal(blockedReadiness.ready, false);
  assert.deepEqual(blockedReadiness.channels, ['email', 'sms']);
  assert.deepEqual(blockedReadiness.providers, ['resend', 'twilio']);
  assert.deepEqual(blockedReadiness.blockers.map((issue) => issue.code), [
    'resend_api_key_missing',
    'twilio_account_sid_missing',
    'twilio_auth_token_missing',
    'twilio_from_number_missing'
  ]);

  const readySummary = buildNotificationProviderReadinessSummary(setting, {
    RESEND_API_KEY: 're_example',
    TWILIO_ACCOUNT_SID: 'AC123',
    TWILIO_AUTH_TOKEN: 'token',
    TWILIO_FROM_NUMBER: '+15551234567'
  });
  assert.equal(readySummary.ready, true);
  assert.deepEqual(readySummary.blockers, []);
  assert.deepEqual(readySummary.warnings, []);

  const manualSummary = buildNotificationProviderReadinessSummary(DEFAULT_NOTIFICATION_PROVIDER_SETTING, {});
  assert.equal(manualSummary.ready, true);
  assert.deepEqual(manualSummary.warnings.map((issue) => issue.code), ['email_manual_provider']);

  const manualSmsSummary = buildNotificationProviderReadinessSummary({
    ...DEFAULT_NOTIFICATION_PROVIDER_SETTING,
    enableOrderEmail: false,
    enableOrderSms: true
  }, {});
  assert.equal(manualSmsSummary.ready, true);
  assert.deepEqual(manualSmsSummary.channels, ['sms']);
  assert.deepEqual(manualSmsSummary.warnings.map((issue) => issue.code), ['sms_manual_provider']);

  const disabledSummary = buildNotificationProviderReadinessSummary({
    ...DEFAULT_NOTIFICATION_PROVIDER_SETTING,
    enableOrderEmail: false,
    enableOrderSms: false
  }, {});
  assert.equal(disabledSummary.ready, true);
  assert.deepEqual(disabledSummary.channels, []);
  assert.ok(disabledSummary.warnings.map((issue) => issue.code).includes('order_notifications_disabled'));

  const inactiveSummary = buildNotificationProviderReadinessSummary({ ...setting, isActive: false }, {
    RESEND_API_KEY: 're_example',
    TWILIO_ACCOUNT_SID: 'AC123',
    TWILIO_AUTH_TOKEN: 'token',
    TWILIO_FROM_NUMBER: '+15551234567'
  });
  assert.equal(inactiveSummary.ready, false);
  assert.deepEqual(inactiveSummary.warnings.map((issue) => issue.code), ['notification_settings_inactive']);

  assert.match(panel, /export function AdminNotificationProviderSettingsPanel/);
  assert.match(panel, /updateNotificationProviderSettingAction/);
  assert.match(panel, /Notification provider readiness/);
  assert.match(panel, /name="emailProvider"/);
  assert.match(panel, /name="smsProvider"/);
  assert.match(panel, /name="requireSmsProviderEnv"/);
  assert.match(panel, /Save notification settings/);

  assert.match(fulfillmentPanel, /notificationProviderSettingsService\.list\(\)/);
  assert.match(fulfillmentPanel, /AdminNotificationProviderSettingsPanel/);

  assert.match(actions, /updateNotificationProviderSettingAction/);
  assert.match(actions, /notificationProviderSettingsService\.update/);
  assert.match(actions, /notification-provider-updated/);

  assert.match(roadmap, /- \[x\] Add notification provider settings\/readiness\./);

  console.log('notification-provider-settings.test.ts passed');
}
