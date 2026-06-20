import assert from 'node:assert/strict';

import {
  ADMIN_ANALYTICS_SAVED_VIEW_APPROVED_POST_ENDPOINTS,
  buildAdminAnalyticsSavedViewManagementPreview
} from '../../lib/analytics/admin-analytics-saved-view-management';
import { buildAdminAnalyticsSavedViewReadModelPreview } from '../../lib/analytics/admin-analytics-saved-view-read-model';

export async function runSavedViewManagementSurfaceTests() {
  const inactiveRows = buildAdminAnalyticsSavedViewReadModelPreview([
    {
      id: 'view-1',
      viewKey: 'business-summary',
      label: 'Business summary',
      description: 'Owner dashboard view',
      scope: 'owner-private',
      audience: 'owner',
      rangeMode: 'preset',
      rangeQuery: 'range=30',
      sectionAnchors: ['#order-analytics', '#business-analytics-charts'],
      ownerApproved: true,
      isActive: true
    }
  ]).rows;

  const staffPreview = buildAdminAnalyticsSavedViewManagementPreview({ isOwner: false, rows: inactiveRows });
  assert.equal(staffPreview.managementUiEnabled, true);
  assert.equal(staffPreview.isStaff, true);
  assert.equal(staffPreview.repositoryWritesEnabled, false);
  assert.equal(staffPreview.writeEndpointsEnabled, false);
  assert.ok(staffPreview.blockers.includes('owner session required for saved-view changes'));
  assert.ok(staffPreview.controls.every((control) => control.enabled === false));

  const ownerPreview = buildAdminAnalyticsSavedViewManagementPreview({
    isOwner: true,
    rows: inactiveRows,
    repositoryReadsEnabled: true,
    repositoryWritesEnabled: true,
    readEndpointEnabled: true,
    writeEndpointsEnabled: true,
    rolePolicyEnforced: true
  });
  assert.equal(ownerPreview.isOwner, true);
  assert.equal(ownerPreview.rolePolicyEnforced, true);
  assert.equal(ownerPreview.metadataOnly, true);
  assert.equal(ownerPreview.rows.length, 1);
  assert.deepEqual(ownerPreview.approvedPostEndpoints, ADMIN_ANALYTICS_SAVED_VIEW_APPROVED_POST_ENDPOINTS);
  assert.ok(ownerPreview.controls.every((control) => control.method === 'post'));
  assert.ok(ownerPreview.controls.every((control) => ownerPreview.approvedPostEndpoints.includes(control.actionPath)));
  assert.ok(ownerPreview.controls.every((control) => control.enabled === true));
  assert.ok(ownerPreview.blockedFields.includes('customer rows'));
  assert.ok(ownerPreview.blockedFields.includes('eventRows'));

  const source = await import('node:fs/promises').then((fs) =>
    fs.readFile('lib/analytics/admin-analytics-saved-view-management.ts', 'utf8')
  );
  assert.doesNotMatch(source, /customerRows\s*:/);
  assert.doesNotMatch(source, /eventRows\s*:/);
  assert.doesNotMatch(source, /exportContents\s*:/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron|schedule\.create|worker\.|queue\./);
  assert.doesNotMatch(source, /sendMail|createTransport|smtp|fetch\(|axios|PrismaClient/);
}
