import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildScheduledReportOpsPlan } from '../../lib/analytics/admin-analytics-scheduled-report-ops-plan';

const OPS_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-ops-plan.ts', import.meta.url);

export async function runScheduledReportOpsPlanTests() {
  const blocked = buildScheduledReportOpsPlan({
    isOwner: false,
    lockKey: null,
    maxConcurrentRuns: 2,
    staleLockTimeoutMinutes: 1,
    alertChannelKey: null,
    escalationOwner: null,
    rollbackDocPath: null
  });
  assert.equal(blocked.status, 'ops_plan_blocked');
  assert.equal(blocked.ownerOnly, true);
  assert.equal(blocked.lockRequired, true);
  assert.equal(blocked.liveAlertSent, false);
  assert.equal(blocked.backgroundLoopStarted, false);
  assert.equal(blocked.schedulerTimerCreated, false);
  assert.ok(blocked.blockers.includes('owner session is required'));
  assert.ok(blocked.blockers.includes('alert channel key is required'));

  const ready = buildScheduledReportOpsPlan({
    isOwner: true,
    operatorApproved: true,
    lockKey: 'scheduled-report-lock',
    maxConcurrentRuns: 1,
    staleLockTimeoutMinutes: 10,
    alertChannelKey: 'ops-alerts',
    escalationOwner: 'owner',
    rollbackDocPath: 'docs/runbooks/scheduled-report-rollback.md'
  });
  assert.equal(ready.status, 'ops_plan_ready');
  assert.equal(ready.liveAlertSent, false);
  assert.equal(ready.backgroundLoopStarted, false);
  assert.equal(ready.schedulerTimerCreated, false);
  assert.equal(ready.maxConcurrentRuns, 1);
  assert.equal(ready.blockers.length, 0);
  assert.ok(ready.checklist.some((item) => item.includes('rollback')));

  const source = await readFile(OPS_PATH, 'utf8');
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron/i);
  assert.doesNotMatch(source, /fetch\(|sendMail|createTransport|nodemailer|smtp/i);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-ops-plan.test.ts passed');
}
