import type { DeployReadinessIssue } from '@/lib/deploy-readiness-types';

export type DataSafetyReadinessConfig = {
  migrationRunbookConfirmed: boolean;
  backupRestoreConfirmed: boolean;
  rollbackPlanConfirmed: boolean;
};

export type DataSafetyReadiness = {
  ready: boolean;
  blockers: DeployReadinessIssue[];
  checklist: string[];
};

function truthy(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export function getDataSafetyReadinessConfig(env: Record<string, string | undefined>): DataSafetyReadinessConfig {
  return {
    migrationRunbookConfirmed: truthy(env.PRODUCTION_MIGRATION_RUNBOOK_CONFIRMED),
    backupRestoreConfirmed: truthy(env.PRODUCTION_BACKUP_RESTORE_CONFIRMED),
    rollbackPlanConfirmed: truthy(env.PRODUCTION_ROLLBACK_PLAN_CONFIRMED)
  };
}

export function getDataSafetyLaunchChecklist() {
  return [
    'Run npm install, npm run db:generate, npm run typecheck, npm run test:unit, and npm run build before applying production schema changes.',
    'Take or verify a restorable production database backup before running npm run db:push or future Prisma migrations.',
    'Apply schema changes with production DATABASE_URL configured and record the deployed git SHA.',
    'Smoke-test inquiry creation, admin inquiry list, assignment, export, print, and notification readiness after schema changes.',
    'Rollback by restoring the verified backup and redeploying the last known-good git SHA if a schema or deploy change fails.'
  ];
}

export function getDataSafetyReadiness(config: DataSafetyReadinessConfig): DataSafetyReadiness {
  const blockers: DeployReadinessIssue[] = [];

  if (!config.migrationRunbookConfirmed) {
    blockers.push({
      code: 'migration_runbook_unconfirmed',
      severity: 'blocker',
      summary: 'Production migration runbook is not confirmed.',
      detail: 'Set PRODUCTION_MIGRATION_RUNBOOK_CONFIRMED=true after reviewing the production migration procedure.'
    });
  }

  if (!config.backupRestoreConfirmed) {
    blockers.push({
      code: 'backup_restore_unconfirmed',
      severity: 'blocker',
      summary: 'Production backup/restore readiness is not confirmed.',
      detail: 'Set PRODUCTION_BACKUP_RESTORE_CONFIRMED=true only after verifying a restorable production database backup process.'
    });
  }

  if (!config.rollbackPlanConfirmed) {
    blockers.push({
      code: 'rollback_plan_unconfirmed',
      severity: 'blocker',
      summary: 'Production rollback plan is not confirmed.',
      detail: 'Set PRODUCTION_ROLLBACK_PLAN_CONFIRMED=true after confirming the last-known-good deploy and database restore path.'
    });
  }

  return {
    ready: blockers.length === 0,
    blockers,
    checklist: getDataSafetyLaunchChecklist()
  };
}
