import assert from 'node:assert/strict';
import { formatDeployReadinessReport, getDeployReadiness } from '../../lib/deploy-readiness';

const ORIGINAL_ENV = { ...process.env };

async function withEnv<T>(env: Record<string, string | undefined>, run: () => Promise<T> | T) {
  process.env = { ...ORIGINAL_ENV };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await run();
  } finally {
    process.env = { ...ORIGINAL_ENV };
  }
}

function issueCodes(report: ReturnType<typeof getDeployReadiness>) {
  return report.blockers.map((issue) => issue.code);
}

const dataSafetyConfirmed = {
  PRODUCTION_MIGRATION_RUNBOOK_CONFIRMED: 'true',
  PRODUCTION_BACKUP_RESTORE_CONFIRMED: 'true',
  PRODUCTION_ROLLBACK_PLAN_CONFIRMED: 'true'
};

const productionBase = {
  APP_MODE: 'production',
  DATABASE_URL: 'postgresql://example.invalid/db',
  ADMIN_PASSWORD: 'password-for-test',
  ADMIN_SESSION_SECRET: '12345678901234567890123456789012',
  ADMIN_ROLE: 'owner',
  MEDIA_STORAGE_PROVIDER: 'cloudinary',
  CLOUDINARY_CLOUD_NAME: 'golara-test',
  CLOUDINARY_UPLOAD_PRESET: 'unsigned-preset',
  INQUIRY_NOTIFICATION_MODE: 'log',
  INQUIRY_NOTIFICATION_WEBHOOK_URL: undefined,
  ...dataSafetyConfirmed
};

export async function runDeployReadinessTests() {
  await withEnv({ APP_MODE: 'preview', VERCEL_ENV: undefined, NODE_ENV: 'production' }, () => {
    const report = getDeployReadiness();
    assert.equal(report.productionDeploy, false);
    assert.equal(report.ready, true);
    assert.deepEqual(issueCodes(report), []);
    assert.equal(report.warnings[0]?.code, 'non_production_mode');
  });

  await withEnv({ APP_MODE: 'production', DATABASE_URL: undefined, ADMIN_PASSWORD: undefined, ADMIN_SESSION_SECRET: undefined, MEDIA_STORAGE_PROVIDER: undefined, INQUIRY_NOTIFICATION_MODE: 'webhook', INQUIRY_NOTIFICATION_WEBHOOK_URL: undefined }, () => {
    const report = getDeployReadiness();
    assert.equal(report.productionDeploy, true);
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), [
      'database_url_missing',
      'admin_password_missing',
      'admin_session_secret_missing',
      'media_storage_not_production_safe',
      'notification_webhook_url_missing',
      'migration_runbook_unconfirmed',
      'backup_restore_unconfirmed',
      'rollback_plan_unconfirmed'
    ]);
  });

  await withEnv({ APP_MODE: 'production', DATABASE_URL: 'postgresql://example.invalid/db', ADMIN_PASSWORD: 'password-for-test', ADMIN_SESSION_SECRET: 'short', MEDIA_STORAGE_PROVIDER: 'cloudinary', CLOUDINARY_CLOUD_NAME: 'golara-test', CLOUDINARY_UPLOAD_PRESET: 'unsigned-preset', INQUIRY_NOTIFICATION_MODE: 'unsupported', ...dataSafetyConfirmed }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), ['admin_session_secret_short', 'notification_mode_unsupported']);
  });

  await withEnv(productionBase, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, true);
    assert.deepEqual(issueCodes(report), []);
    assert.deepEqual(report.warnings.map((issue) => issue.code), ['notification_log_only', 'checkout_inquiry_mode', 'overseas_whatsapp_fallback']);
    assert.match(formatDeployReadinessReport(report), /Deploy readiness: ready/);
  });

  await withEnv({ ...productionBase, ADMIN_ROLE: 'staff', INQUIRY_NOTIFICATION_MODE: 'webhook', INQUIRY_NOTIFICATION_WEBHOOK_URL: 'https://example.invalid/webhook' }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, true);
    assert.deepEqual(issueCodes(report), []);
    assert.deepEqual(report.warnings.map((issue) => issue.code), ['checkout_inquiry_mode', 'overseas_whatsapp_fallback']);
  });

  await withEnv({
    ...productionBase,
    CHECKOUT_MODE: 'gateway',
    CHECKOUT_DOMESTIC_GATEWAY_PROVIDER: 'zarinpal',
    CHECKOUT_DOMESTIC_CURRENCY: 'TOMAN',
    CHECKOUT_OVERSEAS_GATEWAY_PROVIDER: 'stripe',
    CHECKOUT_OVERSEAS_CURRENCY: 'USD',
    CHECKOUT_OVERSEAS_FALLBACK: 'stripe',
    ZARINPAL_MERCHANT_ID: 'merchant-for-test',
    STRIPE_SECRET_KEY: 'stripe-secret-for-test',
    STRIPE_WEBHOOK_SECRET: undefined,
    ZARINPAL_WEBHOOK_SECRET: undefined,
    PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED: undefined,
    PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED: undefined
  }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), [
      'stripe_webhook_secret_missing',
      'zarinpal_webhook_secret_missing',
      'payment_settlement_migration_unconfirmed',
      'payment_webhook_smoke_tests_unconfirmed'
    ]);
    assert.match(formatDeployReadinessReport(report), /STRIPE_WEBHOOK_SECRET is missing/);
  });

  await withEnv({
    ...productionBase,
    CHECKOUT_MODE: 'gateway',
    CHECKOUT_DOMESTIC_GATEWAY_PROVIDER: 'zarinpal',
    CHECKOUT_DOMESTIC_CURRENCY: 'TOMAN',
    CHECKOUT_OVERSEAS_GATEWAY_PROVIDER: 'stripe',
    CHECKOUT_OVERSEAS_CURRENCY: 'USD',
    CHECKOUT_OVERSEAS_FALLBACK: 'stripe',
    ZARINPAL_MERCHANT_ID: 'merchant-for-test',
    STRIPE_SECRET_KEY: 'stripe-secret-for-test',
    STRIPE_WEBHOOK_SECRET: 'stripe-webhook-for-test',
    ZARINPAL_WEBHOOK_SECRET: 'zarinpal-webhook-for-test',
    PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED: 'true',
    PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED: 'true'
  }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, true);
    assert.deepEqual(issueCodes(report), []);
    assert.deepEqual(report.warnings.map((issue) => issue.code), ['notification_log_only']);
  });

  console.log('deploy-readiness.test.ts passed');
}
