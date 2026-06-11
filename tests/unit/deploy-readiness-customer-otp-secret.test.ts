import assert from 'node:assert/strict';
import { getDeployReadiness } from '../../lib/deploy-readiness';

const ORIGINAL_ENV = { ...process.env };

async function withProductionEnv(run: () => Promise<void> | void) {
  process.env = {
    ...ORIGINAL_ENV,
    APP_MODE: 'production',
    DATABASE_URL: 'postgresql://example.invalid/db',
    ADMIN_PASSWORD: 'password-for-test',
    ADMIN_SESSION_SECRET: '12345678901234567890123456789012',
    ADMIN_ROLE: 'owner',
    MEDIA_STORAGE_PROVIDER: 'cloudinary',
    CLOUDINARY_CLOUD_NAME: 'golara-test',
    CLOUDINARY_UPLOAD_PRESET: 'unsigned-preset',
    INQUIRY_NOTIFICATION_MODE: 'log',
    PRODUCTION_MIGRATION_RUNBOOK_CONFIRMED: 'true',
    PRODUCTION_BACKUP_RESTORE_CONFIRMED: 'true',
    PRODUCTION_ROLLBACK_PLAN_CONFIRMED: 'true'
  };

  try {
    await run();
  } finally {
    process.env = { ...ORIGINAL_ENV };
  }
}

function blockerCodes() {
  return getDeployReadiness().blockers.map((issue) => issue.code);
}

export async function runDeployReadinessCustomerOtpSecretTests() {
  await withProductionEnv(() => {
    delete process.env.CUSTOMER_OTP_SECRET;
    assert.deepEqual(blockerCodes(), ['customer_otp_secret_missing']);
  });

  await withProductionEnv(() => {
    process.env.CUSTOMER_OTP_SECRET = 'short';
    assert.deepEqual(blockerCodes(), ['customer_otp_secret_short']);
  });

  await withProductionEnv(() => {
    process.env.CUSTOMER_OTP_SECRET = '12345678901234567890123456789012';
    assert.equal(blockerCodes().includes('customer_otp_secret_missing'), false);
    assert.equal(blockerCodes().includes('customer_otp_secret_short'), false);
  });

  console.log('deploy-readiness-customer-otp-secret.test.ts passed');
}

void runDeployReadinessCustomerOtpSecretTests();
