import assert from 'node:assert/strict';
import { getDataSafetyLaunchChecklist, getDataSafetyReadiness, getDataSafetyReadinessConfig } from '../../lib/data-safety-readiness';

export async function runDataSafetyReadinessTests() {
  assert.deepEqual(getDataSafetyReadinessConfig({}), {
    migrationRunbookConfirmed: false,
    backupRestoreConfirmed: false,
    rollbackPlanConfirmed: false
  });
  assert.deepEqual(getDataSafetyReadinessConfig({
    PRODUCTION_MIGRATION_RUNBOOK_CONFIRMED: ' true ',
    PRODUCTION_BACKUP_RESTORE_CONFIRMED: '1',
    PRODUCTION_ROLLBACK_PLAN_CONFIRMED: 'yes'
  }), {
    migrationRunbookConfirmed: true,
    backupRestoreConfirmed: true,
    rollbackPlanConfirmed: true
  });

  const blocked = getDataSafetyReadiness({
    migrationRunbookConfirmed: false,
    backupRestoreConfirmed: false,
    rollbackPlanConfirmed: false
  });
  assert.equal(blocked.ready, false);
  assert.deepEqual(blocked.blockers.map((issue) => issue.code), [
    'migration_runbook_unconfirmed',
    'backup_restore_unconfirmed',
    'rollback_plan_unconfirmed'
  ]);
  assert.equal(blocked.checklist.length, 5);

  const ready = getDataSafetyReadiness({
    migrationRunbookConfirmed: true,
    backupRestoreConfirmed: true,
    rollbackPlanConfirmed: true
  });
  assert.equal(ready.ready, true);
  assert.deepEqual(ready.blockers, []);
  assert.deepEqual(ready.checklist, getDataSafetyLaunchChecklist());
  assert.match(ready.checklist[1], /restorable production database backup/);

  console.log('data-safety-readiness.test.ts passed');
}
