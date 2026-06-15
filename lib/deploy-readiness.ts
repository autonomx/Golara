import { getDataSafetyReadiness, getDataSafetyReadinessConfig } from '@/lib/data-safety-readiness';
import type { DeployReadinessIssue, DeployReadinessSeverity } from '@/lib/deploy-readiness-types';
import { getMediaStorageReadiness } from '@/lib/media/media-storage-readiness';
import { getInquiryNotificationConfig, getInquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications-core';
import { getAppRuntimeMode, type AppRuntimeMode } from '@/lib/runtime-mode';
import { getPaymentGatewayConfig, getPaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import { getPaymentProductionGateConfig, getPaymentProductionGates } from '@/lib/checkout/payment-production-gates';

export type { DeployReadinessIssue, DeployReadinessSeverity } from '@/lib/deploy-readiness-types';

export type DeployReadinessReport = {
  appMode: AppRuntimeMode;
  productionDeploy: boolean;
  ready: boolean;
  blockers: DeployReadinessIssue[];
  warnings: DeployReadinessIssue[];
};

const MIN_ADMIN_PASSWORD_LENGTH = 12;
const MIN_SECRET_LENGTH = 32;
const WEAK_SECRET_MARKERS = ['replace', 'changeme', 'change-me', 'placeholder', 'example', 'demo', 'test-secret'];
const EXACT_WEAK_SECRETS = new Set(['admin', 'password', 'secret', 'changeme', 'replace-me', 'example-secret']);

function envValue(name: string) {
  return process.env[name]?.trim() || '';
}

function hasEnv(name: string) {
  return Boolean(envValue(name));
}

function envFlag(name: string) {
  return envValue(name).toLowerCase() === 'true';
}

function normalizedSecret(value: string) {
  return value.trim().toLowerCase();
}

function isWeakSecretValue(value: string) {
  const normalized = normalizedSecret(value);
  if (!normalized) return false;
  if (EXACT_WEAK_SECRETS.has(normalized)) return true;
  return WEAK_SECRET_MARKERS.some((marker) => normalized.includes(marker));
}

function pushIssue(issues: DeployReadinessIssue[], issue: DeployReadinessIssue) {
  issues.push(issue);
}

function pushMissingSecretIssue(blockers: DeployReadinessIssue[], name: string, code: string, summary: string, detail: string) {
  if (hasEnv(name)) return false;
  pushIssue(blockers, { code, severity: 'blocker', summary, detail });
  return true;
}

function validateMinimumSecretLength(blockers: DeployReadinessIssue[], name: string, minimumLength: number, code: string, summary: string, detail: string) {
  const value = envValue(name);
  if (!value || value.length >= minimumLength) return;
  pushIssue(blockers, { code, severity: 'blocker', summary, detail });
}

function validateNoWeakSecretPlaceholder(blockers: DeployReadinessIssue[], name: string, code: string, summary: string, detail: string) {
  const value = envValue(name);
  if (!value || !isWeakSecretValue(value)) return;
  pushIssue(blockers, { code, severity: 'blocker', summary, detail });
}

function validateNotificationReadiness(blockers: DeployReadinessIssue[], warnings: DeployReadinessIssue[]) {
  const notificationReadiness = getInquiryNotificationReadiness(getInquiryNotificationConfig(process.env));
  blockers.push(...notificationReadiness.blockers);
  warnings.push(...notificationReadiness.warnings);
}

function validateDataSafetyReadiness(blockers: DeployReadinessIssue[]) {
  const dataSafety = getDataSafetyReadiness(getDataSafetyReadinessConfig(process.env));
  blockers.push(...dataSafety.blockers);
}

function validateAdminReadiness(blockers: DeployReadinessIssue[]) {
  const missingAdminPassword = pushMissingSecretIssue(
    blockers,
    'ADMIN_PASSWORD',
    'admin_password_missing',
    'ADMIN_PASSWORD is missing.',
    'Set a temporary admin password before production deploy.'
  );

  if (!missingAdminPassword) {
    validateMinimumSecretLength(
      blockers,
      'ADMIN_PASSWORD',
      MIN_ADMIN_PASSWORD_LENGTH,
      'admin_password_short',
      'ADMIN_PASSWORD is too short.',
      `Use an admin password at least ${MIN_ADMIN_PASSWORD_LENGTH} characters long before production deploy.`
    );
    validateNoWeakSecretPlaceholder(
      blockers,
      'ADMIN_PASSWORD',
      'admin_password_placeholder',
      'ADMIN_PASSWORD uses a placeholder or default value.',
      'Use a unique non-default admin password before production deploy.'
    );
  }

  const missingSessionSecret = pushMissingSecretIssue(
    blockers,
    'ADMIN_SESSION_SECRET',
    'admin_session_secret_missing',
    'ADMIN_SESSION_SECRET is missing.',
    'Set a long random session secret before production deploy.'
  );

  if (!missingSessionSecret) {
    validateMinimumSecretLength(
      blockers,
      'ADMIN_SESSION_SECRET',
      MIN_SECRET_LENGTH,
      'admin_session_secret_short',
      'ADMIN_SESSION_SECRET is too short.',
      `Use a high-entropy secret at least ${MIN_SECRET_LENGTH} characters long.`
    );
    validateNoWeakSecretPlaceholder(
      blockers,
      'ADMIN_SESSION_SECRET',
      'admin_session_secret_placeholder',
      'ADMIN_SESSION_SECRET uses a placeholder or default value.',
      'Use a unique high-entropy admin session secret before production deploy.'
    );
  }

  const role = envValue('ADMIN_ROLE').toLowerCase();
  if (role && role !== 'owner' && role !== 'staff') {
    pushIssue(blockers, {
      code: 'admin_role_invalid',
      severity: 'blocker',
      summary: `Unsupported ADMIN_ROLE: ${role}.`,
      detail: 'Use ADMIN_ROLE=owner or ADMIN_ROLE=staff.'
    });
  }
}

function validateCustomerAuthReadiness(blockers: DeployReadinessIssue[]) {
  const missingCustomerOtpSecret = pushMissingSecretIssue(
    blockers,
    'CUSTOMER_OTP_SECRET',
    'customer_otp_secret_missing',
    'CUSTOMER_OTP_SECRET is missing.',
    'Set a dedicated high-entropy customer OTP secret before production deploy.'
  );

  if (!missingCustomerOtpSecret) {
    validateMinimumSecretLength(
      blockers,
      'CUSTOMER_OTP_SECRET',
      MIN_SECRET_LENGTH,
      'customer_otp_secret_short',
      'CUSTOMER_OTP_SECRET is too short.',
      `Use a high-entropy customer OTP secret at least ${MIN_SECRET_LENGTH} characters long.`
    );
    validateNoWeakSecretPlaceholder(
      blockers,
      'CUSTOMER_OTP_SECRET',
      'customer_otp_secret_placeholder',
      'CUSTOMER_OTP_SECRET uses a placeholder or default value.',
      'Use a unique high-entropy customer OTP secret before production deploy.'
    );
  }
}

function validateMediaReadiness(blockers: DeployReadinessIssue[]) {
  const mediaStorage = getMediaStorageReadiness();
  if (mediaStorage.productionSafe && mediaStorage.configured) return;

  pushIssue(blockers, {
    code: 'media_storage_not_production_safe',
    severity: 'blocker',
    summary: mediaStorage.summary,
    detail: mediaStorage.detail
  });
}

function validatePaymentReadiness(blockers: DeployReadinessIssue[], warnings: DeployReadinessIssue[]) {
  const paymentConfig = getPaymentGatewayConfig(process.env);
  const paymentReadiness = getPaymentGatewayReadiness(paymentConfig, process.env);

  if (paymentConfig.checkoutMode !== 'gateway') {
    warnings.push(...paymentReadiness.warnings);
  } else {
    blockers.push(...paymentReadiness.blockers);
    warnings.push(...paymentReadiness.warnings);

    const providers = new Set(paymentReadiness.providers);
    if (paymentConfig.overseasFallback === 'stripe') providers.add('stripe');

    if (providers.has('stripe') && !hasEnv('STRIPE_WEBHOOK_SECRET')) {
      pushIssue(blockers, {
        code: 'stripe_webhook_secret_missing',
        severity: 'blocker',
        summary: 'STRIPE_WEBHOOK_SECRET is missing for gateway checkout.',
        detail: 'Set the Stripe endpoint signing secret before accepting production Stripe webhook traffic.'
      });
    }

    if (providers.has('zarinpal') && !hasEnv('ZARINPAL_WEBHOOK_SECRET')) {
      pushIssue(blockers, {
        code: 'zarinpal_webhook_secret_missing',
        severity: 'blocker',
        summary: 'ZARINPAL_WEBHOOK_SECRET is missing for gateway checkout.',
        detail: 'Set the shared ZarinPal/Golara webhook HMAC secret before accepting production ZarinPal webhook traffic.'
      });
    }

    if (!envFlag('PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED')) {
      pushIssue(blockers, {
        code: 'payment_settlement_migration_unconfirmed',
        severity: 'blocker',
        summary: 'Payment settlement migration has not been confirmed.',
        detail: 'Apply and verify prisma/migrations/20260604170000_add_payment_settlement_reconciliation before production gateway checkout.'
      });
    }

    if (!envFlag('PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED')) {
      pushIssue(blockers, {
        code: 'payment_webhook_smoke_tests_unconfirmed',
        severity: 'blocker',
        summary: 'Payment webhook smoke tests have not been confirmed.',
        detail: 'Run docs/production-roadmap-phase32-payment-webhook-smoke-tests.md against the target provider dashboards before production gateway checkout.'
      });
    }
  }

  for (const gate of getPaymentProductionGates(getPaymentProductionGateConfig(process.env))) {
    pushIssue(blockers, {
      code: gate.code,
      severity: 'blocker',
      summary: gate.summary,
      detail: gate.detail
    });
  }
}

export function getDeployReadiness(): DeployReadinessReport {
  const appMode = getAppRuntimeMode();
  const productionDeploy = appMode === 'production';
  const blockers: DeployReadinessIssue[] = [];
  const warnings: DeployReadinessIssue[] = [];

  if (!productionDeploy) {
    pushIssue(warnings, {
      code: 'non_production_mode',
      severity: 'warning',
      summary: `Deploy readiness guard is running in ${appMode} mode.`,
      detail: 'This guard blocks only production deploys. Set APP_MODE=production or VERCEL_ENV=production to validate production readiness.'
    });
  } else {
    if (!hasEnv('DATABASE_URL')) {
      pushIssue(blockers, {
        code: 'database_url_missing',
        severity: 'blocker',
        summary: 'DATABASE_URL is missing.',
        detail: 'Set a production PostgreSQL DATABASE_URL before production deploy.'
      });
    }

    validateAdminReadiness(blockers);
    validateCustomerAuthReadiness(blockers);
    validateMediaReadiness(blockers);
    validateNotificationReadiness(blockers, warnings);
    validateDataSafetyReadiness(blockers);
    validatePaymentReadiness(blockers, warnings);
  }

  return {
    appMode,
    productionDeploy,
    ready: blockers.length === 0,
    blockers,
    warnings
  };
}

export function formatDeployReadinessReport(report: DeployReadinessReport) {
  const lines = [
    `Deploy readiness: ${report.ready ? 'ready' : 'blocked'}`,
    `APP_MODE: ${report.appMode}`,
    `Production deploy: ${report.productionDeploy ? 'yes' : 'no'}`
  ];

  if (report.blockers.length > 0) {
    lines.push('', 'Blockers:');
    for (const issue of report.blockers) {
      lines.push(`- [${issue.code}] ${issue.summary}`);
      lines.push(`  ${issue.detail}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('', 'Warnings:');
    for (const issue of report.warnings) {
      lines.push(`- [${issue.code}] ${issue.summary}`);
      lines.push(`  ${issue.detail}`);
    }
  }

  return lines.join('\n');
}
