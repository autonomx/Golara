import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildAdminAnalyticsScheduledReportManagementSurfaceContract } from '../../lib/analytics/admin-analytics-scheduled-report-management-surface';

const PAGE_PATH = new URL('../../app/admin/analytics/scheduled-reports/page.tsx', import.meta.url);

export async function runScheduledReportManagementSurfaceTests() {
  const ownerSurface = buildAdminAnalyticsScheduledReportManagementSurfaceContract({ isOwner: true });
  assert.equal(ownerSurface.status, 'management_surface_visible_runtime_disabled');
  assert.equal(ownerSurface.routePath, '/admin/analytics/scheduled-reports');
  assert.equal(ownerSurface.visibleToOwner, true);
  assert.equal(ownerSurface.repositoryReadPathEnabled, false);
  assert.equal(ownerSurface.repositoryWritePathEnabled, false);
  assert.equal(ownerSurface.readEndpointEnabled, false);
  assert.equal(ownerSurface.writeEndpointEnabled, false);
  assert.equal(ownerSurface.managementControlsEnabled, false);
  assert.equal(ownerSurface.schedulerEnabled, false);
  assert.equal(ownerSurface.deliveryExecutionEnabled, false);
  assert.ok(ownerSurface.controls.length >= 6);
  assert.ok(ownerSurface.controls.every((control) => control.enabled === false));

  const staffSurface = buildAdminAnalyticsScheduledReportManagementSurfaceContract({ isOwner: false });
  assert.equal(staffSurface.visibleToStaff, true);
  assert.equal(staffSurface.visibleToOwner, false);

  const pageSource = await readFile(PAGE_PATH, 'utf8');
  assert.match(pageSource, /buildAdminAnalyticsScheduledReportManagementSurfaceContract/);
  assert.match(pageSource, /requireAdminRouteSession/);
  assert.match(pageSource, /identity\.role === 'owner'/);
  assert.doesNotMatch(pageSource, /<form\b/i);
  assert.doesNotMatch(pageSource, /\baction=/i);
  assert.doesNotMatch(pageSource, /\bmethod=/i);
  assert.doesNotMatch(pageSource, /createGatedAdminAnalyticsScheduledReportRecordingRepositoryFactory/);
  assert.doesNotMatch(pageSource, /createGatedAdminAnalyticsScheduledReportPrismaReaderFactory/);
  assert.doesNotMatch(pageSource, /PrismaClient/);
  assert.doesNotMatch(pageSource, /\.findMany\(/);
  assert.doesNotMatch(pageSource, /\.update\(/);
  assert.doesNotMatch(pageSource, /setInterval|setTimeout|cron|enqueue/i);

  console.log('scheduled-report-management-surface.test.ts passed');
}
