import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export async function runSiteRetentionScreenTests() {
  const source = await readFile('app/admin/analytics/site-retention/page.tsx', 'utf8');

  assert.match(source, /Site analytics retention cleanup/);
  assert.match(source, /buildSiteAnalyticsRetentionCleanupPlan/);
  assert.match(source, /siteAnalyticsRetentionService\.summary/);
  assert.match(source, /site-retention\/cleanup/);
  assert.match(source, /manualOwnerConfirmation/);
  assert.match(source, /Not attached by default/);
  assert.match(source, /Not started/);
  assert.match(source, /disabled=\{!plan\.accepted \|\| !executionFlagEnabled\}/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron|sendMail|createTransport|fetch\(/);
}
