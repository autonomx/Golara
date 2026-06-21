import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export async function runSiteRetentionRouteTests() {
  const source = await readFile('app/admin/analytics/site-retention/cleanup/route.ts', 'utf8');

  assert.match(source, /assertAdminRole\('owner'\)/);
  assert.match(source, /buildSiteAnalyticsRetentionCleanupPlan/);
  assert.match(source, /buildSiteAnalyticsRetentionCleanupDelegate/);
  assert.match(source, /executeSiteAnalyticsRetentionCleanup/);
  assert.match(source, /databaseConfigured: summary\.databaseConfigured && summary\.tableAvailable/);
  assert.match(source, /manualOwnerConfirmation/);
  assert.match(source, /delegateAttached: delegateAttachment\.state\.attached/);
  assert.match(source, /backgroundJobStarted: false/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron|queue|worker|sendMail|createTransport|fetch\(/);
}
