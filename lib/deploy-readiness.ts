import { getMediaStorageReadiness } from '@/lib/media/media-storage-readiness';
import { getAppRuntimeMode, type AppRuntimeMode } from '@/lib/runtime-mode';

export type DeployReadinessSeverity = 'blocker' | 'warning';

export type DeployReadinessIssue = {
  code: string;
  severity: DeployReadinessSeverity;
  summary: string;
  detail: string;
};

export type DeployReadinessReport = {
  appMode: AppRuntimeMode;
  productionDeploy: boolean;
  ready: boolean;
  blockers: DeployReadinessIssue[];
  warnings: DeployReadinessIssue[];
};

function envValue(name: string) {
  return process.env[name]?.trim() || '';
}

function hasEnv(name: string) {
  return Boolean(envValue(name));
}

function pushIssue(issues: DeployReadinessIssue[], issue: DeployReadinessIssue) {
  issues.push(issue);
}

function notificationMode() {
  return envValue('INQUIRY_NOTIFICATION_MODE').toLowerCase() || 'log';
}

function validateNotificationReadiness(blockers: DeployReadinessIssue[], warnings: DeployReadinessIssue[]) {
  const mode = notificationMode();

  if (mode === 'webhook') {
    if (!hasEnv('INQUIRY_NOTIFICATION_WEBHOOK_URL')) {
      pushIssue(blockers, {
        code: 'notification_webhook_url_missing',
        severity: 'blocker',
        summary: 'Webhook notifications are selected but the webhook URL is missing.',
        detail: 'Set INQUIRY_NOTIFICATION_WEBHOOK_URL or switch INQUIRY_NOTIFICATION_MODE to log before production deploy.'
      });
    }
    return;
  }

  if (mode === 'log') {
    pushIssue(warnings, {
      code: 'notification_log_only',
      severity: 'warning',
      summary: 'Inquiry notifications are log-only.',
      detail: 'Staff must monitor the admin inbox until webhook, email, or WhatsApp delivery is configured.'
    });
    return;
  }

  pushIssue(blockers, {
    code: 'notification_mode_unsupported',
    severity: 'blocker',
    summary: `Unsupported inquiry notification mode: ${mode}.`,
    detail: 'Use INQUIRY_NOTIFICATION_MODE=log or INQUIRY_NOTIFICATION_MODE=webhook before production deploy.'
  });
}

function validateAdminReadiness(blockers: DeployReadinessIssue[]) {
  if (!hasEnv('ADMIN_PASSWORD')) {
    pushIssue(blockers, {
      code: 'admin_password_missing',
      severity: 'blocker',
      summary: 'ADMIN_PASSWORD is missing.',
      detail: 'Set a temporary admin password before production deploy.'
    });
  }

  const sessionSecret = envValue('ADMIN_SESSION_SECRET');
  if (!sessionSecret) {
    pushIssue(blockers, {
      code: 'admin_session_secret_missing',
      severity: 'blocker',
      summary: 'ADMIN_SESSION_SECRET is missing.',
      detail: 'Set a long random session secret before production deploy.'
    });
  } else if (sessionSecret.length < 32) {
    pushIssue(blockers, {
      code: 'admin_session_secret_short',
      severity: 'blocker',
      summary: 'ADMIN_SESSION_SECRET is too short.',
      detail: 'Use a high-entropy secret at least 32 characters long.'
    });
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
    validateMediaReadiness(blockers);
    validateNotificationReadiness(blockers, warnings);
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
