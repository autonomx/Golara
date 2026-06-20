import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export async function runSavedViewPageSurfaceTests() {
  const pageSource = await readFile('app/admin/analytics/saved-views/page.tsx', 'utf8');

  assert.match(pageSource, /Saved dashboard views/);
  assert.match(pageSource, /buildAdminAnalyticsSavedViewManagementPreview/);
  assert.match(pageSource, /loadAdminAnalyticsSavedViewReadEndpointModel/);
  assert.match(pageSource, /savedViewRouteGateStateFromEnv/);
  assert.match(pageSource, /assertion|requireAdminRouteSession|Owner session detected/);
  assert.match(pageSource, /action=\{control\.actionPath\}/);
  assert.match(pageSource, /method=\{control\.method\}/);
  assert.match(pageSource, /disabled=\{!control\.enabled\}/);
  assert.match(pageSource, /metadata without storing analytics rows/);
  assert.doesNotMatch(pageSource, /findMany\(|upsert\(|update\(|delete\(|prisma|sendMail|createTransport|setInterval|setTimeout|cron|fetch\(/);
}
