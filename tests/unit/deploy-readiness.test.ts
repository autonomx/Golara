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
      'notification_webhook_url_missing'
    ]);
  });

  await withEnv({ APP_MODE: 'production', DATABASE_URL: 'postgresql://example.invalid/db', ADMIN_PASSWORD: 'secret-password', ADMIN_SESSION_SECRET: 'short', MEDIA_STORAGE_PROVIDER: 'cloudinary', CLOUDINARY_CLOUD_NAME: 'golara-test', CLOUDINARY_UPLOAD_PRESET: 'unsigned-preset', INQUIRY_NOTIFICATION_MODE: 'unsupported' }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, false);
    assert.deepEqual(issueCodes(report), ['admin_session_secret_short', 'notification_mode_unsupported']);
  });

  await withEnv({ APP_MODE: 'production', DATABASE_URL: 'postgresql://example.invalid/db', ADMIN_PASSWORD: 'secret-password', ADMIN_SESSION_SECRET: '12345678901234567890123456789012', ADMIN_ROLE: 'owner', MEDIA_STORAGE_PROVIDER: 'cloudinary', CLOUDINARY_CLOUD_NAME: 'golara-test', CLOUDINARY_UPLOAD_PRESET: 'unsigned-preset', INQUIRY_NOTIFICATION_MODE: 'log', INQUIRY_NOTIFICATION_WEBHOOK_URL: undefined }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, true);
    assert.deepEqual(issueCodes(report), []);
    assert.deepEqual(report.warnings.map((issue) => issue.code), ['notification_log_only']);
    assert.match(formatDeployReadinessReport(report), /Deploy readiness: ready/);
  });

  await withEnv({ APP_MODE: 'production', DATABASE_URL: 'postgresql://example.invalid/db', ADMIN_PASSWORD: 'secret-password', ADMIN_SESSION_SECRET: '12345678901234567890123456789012', ADMIN_ROLE: 'staff', MEDIA_STORAGE_PROVIDER: 'cloudinary', CLOUDINARY_CLOUD_NAME: 'golara-test', CLOUDINARY_UPLOAD_PRESET: 'unsigned-preset', INQUIRY_NOTIFICATION_MODE: 'webhook', INQUIRY_NOTIFICATION_WEBHOOK_URL: 'https://example.invalid/webhook' }, () => {
    const report = getDeployReadiness();
    assert.equal(report.ready, true);
    assert.deepEqual(issueCodes(report), []);
    assert.deepEqual(report.warnings, []);
  });

  console.log('deploy-readiness.test.ts passed');
}
