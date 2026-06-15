import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatDeployReadinessReport, getDeployReadiness } from '../../lib/deploy-readiness';

const ORIGINAL_ENV = { ...process.env };
const NEXT_CONFIG = readFileSync('next.config.mjs', 'utf8');

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

function assertPlatformConfigIsProductionScoped() {
  assert.match(NEXT_CONFIG, /async\s+headers\s*\(\)\s*{/);
  assert.match(NEXT_CONFIG, /Strict-Transport-Security/);
  assert.match(NEXT_CONFIG, /max-age=63072000; includeSubDomains; preload/);
  assert.match(NEXT_CONFIG, /X-Frame-Options[\s\S]*?DENY/);
  assert.match(NEXT_CONFIG, /X-Content-Type-Options[\s\S]*?nosniff/);
  assert.match(NEXT_CONFIG, /Referrer-Policy[\s\S]*?strict-origin-when-cross-origin/);
  assert.match(NEXT_CONFIG, /Permissions-Policy/);
  assert.match(NEXT_CONFIG, /hostname:\s*'res\.cloudinary\.com'/);
  assert.doesNotMatch(NEXT_CONFIG, /hostname:\s*'\*\*'/);
  assert.doesNotMatch(NEXT_CONFIG, /protocol:\s*'http'/);
}

const dataSafetyConfirmed = {
  PRODUCTION_MIGRATION_RUNBOOK_CONFIRMED: 'true',
  PRODUCTION_BACKUP_RESTORE_CONFIRMED: 'true',
  PRODUCTION_ROLLBACK_PLAN_CONFIRMED: 'true'
};

const productionBase = {
  APP_MODE: 'production',
  DATABASE_URL: 'postgresql://example.invalid/db',
  ADMIN_PASSWORD: 'production-admin-password-for-test',
  ADMIN_SESSION_SECRET: 'admin-session-secret-for-test-1234567890',
  CUSTOMER_OTP_SECRET: 'customer-otp-secret-for-test-1234567890',
  ADMIN_ROLE: 'owner',
  MEDIA_STORAGE_PROVIDER: 'cloudinary',
  CLOUDINARY_CLOUD_NAME: 'golara-test',
  CLOUDINARY_UPLOAD_PRESET: 'unsigned-preset',
  INQUIRY_NOTIFICATION_MODE: 'log',
  INQUIRY_NOTIFICATION_WEBHOOK_URL: undefined,
  ...dataSafetyConfirmed
};

const gatewayBase = {
  ...productionBase,
  CHECKOUT_MODE: 'gateway',
  CHECKOUT_DOMESTIC_GATEWAY_PROVIDER: 'zarinpal',
  CHECKOUT_DOMESTIC_CURRENCY: 'TOMAN',
  CHECKOUT_OVERSEAS_GATEWAY_PROVIDER: 'stripe',
  CHECKOUT_OVERSEAS_CURRENCY: 'USD',
  CHECKOUT_OVERSEAS_FALLBACK: 'stripe',
  ZARINPAL_MERCHANT_ID: 'merchant-for-test',
  STRIPE_SECRET_KEY: 'stripe-secret-for-test'
};

export async function runDeployReadinessTests() {
  assertPlatformConfigIsProductionScoped();

  await withEnv({ APP_MODE: 'preview', VERCEL_ENV: undefined, NODE_ENV: 'production' }, () => {
    const report = getDeployReadiness();
    assert.equal(report.productionDeploy, false);
    assert.equal(report.ready, true);
    assert.deepEqual(issueCodes(report), []);
    assert.equal(report.warnings[0]?.code, 'non_production_mode');
  });

  await withEnv({ APP_MODE: 'production', DATABASE_URL: undefined, ADMIN_PASSWORD: undefined, ADMIN_SESSION_SECRET: undefined, CUSTOMER_OTP_SECRET: undefined, MEDIA_STORAGE_PROVIDER: undefined, INQUIRY_NOTIFICATION_MODE: 'webhook', INQUIRY_NOTIFICATION_WEBHOOK_URL: undefined }, () => {
    const report = getDeployReadiness();
    assert.equal(report.productionDeploy, true);
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), [
      'database_url_missing',
      'admin_password_missing',
      'admin_session_secret_missing',
      'customer_otp_secret_missing',
      'media_storage_not_production_safe',
      'notification_webhook_url_missing',
      'migration_runbook_unconfirmed',
      'backup_restore_unconfirmed',
      'rollback_plan_unconfirmed'
    ]);
  });

  await withEnv({ ...productionBase, ADMIN_PASSWORD: 'short', ADMIN_SESSION_SECRET: 'short', CUSTOMER_OTP_SECRET: 'short', INQUIRY_NOTIFICATION_MODE: 'unsupported' }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), [
      'admin_password_short',
      'admin_session_secret_short',
      'customer_otp_secret_short',
      'notification_mode_unsupported'
    ]);
  });

  await withEnv({ ...productionBase, ADMIN_PASSWORD: 'changeme-admin-password', ADMIN_SESSION_SECRET: 'replace-admin-session-secret-1234567890', CUSTOMER_OTP_SECRET: 'example-customer-otp-secret-1234567890' }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), [
      'admin_password_placeholder',
      'admin_session_secret_placeholder',
      'customer_otp_secret_placeholder'
    ]);
    assert.match(formatDeployReadinessReport(report), /placeholder or default/);
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
    ...gatewayBase,
    STRIPE_WEBHOOK_SECRET: undefined,
    ZARINPAL_WEBHOOK_SECRET: undefined,
    PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED: undefined,
    PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED: undefined,
    PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED: undefined,
    PAYMENT_PRODUCTION_MONITORING_CONFIRMED: undefined
  }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), [
      'stripe_webhook_secret_missing',
      'zarinpal_webhook_secret_missing',
      'payment_settlement_migration_unconfirmed',
      'payment_webhook_smoke_tests_unconfirmed',
      'payment_browser_smoke_tests_unconfirmed',
      'payment_production_monitoring_unconfirmed'
    ]);
    assert.match(formatDeployReadinessReport(report), /STRIPE_WEBHOOK_SECRET is missing/);
    assert.match(formatDeployReadinessReport(report), /Payment browser smoke tests have not been confirmed/);
  });

  await withEnv({
    ...gatewayBase,
    STRIPE_WEBHOOK_SECRET: 'stripe-webhook-for-test',
    ZARINPAL_WEBHOOK_SECRET: 'zarinpal-webhook-for-test',
    PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED: 'true',
    PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED: 'true',
    PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED: 'true',
    PAYMENT_PRODUCTION_MONITORING_CONFIRMED: 'true'
  }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, true);
    assert.deepEqual(issueCodes(report), []);
    assert.deepEqual(report.warnings.map((issue) => issue.code), ['notification_log_only']);
  });

  await withEnv({
    ...productionBase,
    PAYMENT_REFUND_VOID_EXECUTION_ENABLED: 'true',
    PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED: undefined,
    PAYMENT_OPERATION_PROVIDER_EVIDENCE_CONFIRMED: undefined,
    PAYMENT_REFUND_VOID_SMOKE_TESTS_CONFIRMED: undefined,
    PAYMENT_OPERATION_STATE_TRANSITIONS_CONFIRMED: undefined,
    PAYMENT_PRODUCTION_MONITORING_CONFIRMED: undefined
  }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), [
      'payment_operation_records_migration_unconfirmed',
      'payment_operation_provider_evidence_unconfirmed',
      'payment_refund_void_smoke_tests_unconfirmed',
      'payment_operation_state_transitions_unconfirmed',
      'payment_production_monitoring_unconfirmed'
    ]);
  });

  await withEnv({
    ...productionBase,
    NOTIFICATION_LIVE_DELIVERY_ENABLED: 'true',
    NOTIFICATION_PROVIDER_EVIDENCE_CONFIRMED: undefined,
    NOTIFICATION_SMOKE_TESTS_CONFIRMED: undefined,
    NOTIFICATION_DELIVERY_PERSISTENCE_CONFIRMED: undefined,
    PAYMENT_PRODUCTION_MONITORING_CONFIRMED: undefined
  }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), [
      'notification_provider_evidence_unconfirmed',
      'notification_smoke_tests_unconfirmed',
      'notification_delivery_persistence_unconfirmed',
      'payment_production_monitoring_unconfirmed'
    ]);
  });

  const deployReadinessSource = readFileSync('lib/deploy-readiness.ts', 'utf8');
  assert.match(deployReadinessSource, /getPaymentProductionGates/);
  assert.match(deployReadinessSource, /getPaymentProductionGateConfig/);

  console.log('deploy-readiness.test.ts passed');
}
