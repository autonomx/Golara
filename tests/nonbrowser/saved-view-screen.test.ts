import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export async function runSavedViewScreenTests() {
  const source = await readFile('app/admin/analytics/saved-views/page.tsx', 'utf8');

  assert.match(source, /Saved dashboard views/);
  assert.match(source, /buildAdminAnalyticsSavedViewManagementPreview/);
  assert.match(source, /loadAdminAnalyticsSavedViewReadEndpointModel/);
  assert.match(source, /savedViewRouteGateStateFromEnv/);
  assert.match(source, /requireAdminRouteSession/);
  assert.match(source, /action=\{control\.actionPath\}/);
  assert.match(source, /method=\{control\.method\}/);
  assert.match(source, /disabled=\{!control\.enabled\}/);
  assert.match(source, /metadata without storing analytics rows/);
  assert.doesNotMatch(source, /findMany\(|upsert\(|update\(|delete\(|prisma|sendMail|createTransport|setInterval|setTimeout|cron|fetch\(/);
}
