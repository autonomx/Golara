import assert from 'node:assert/strict';

import { buildAdminStatusSummaryView } from '../../lib/admin/status-summary-view';

export async function runAdminStatusSummaryViewTests() {
  const readyView = buildAdminStatusSummaryView({
    title: 'Readiness',
    ready: true,
    summary: 'Ready for review.',
    rows: [
      { label: 'Flag', value: 'ENABLED' },
      { label: 'Evidence', value: 'Attached' }
    ]
  });

  assert.equal(readyView.title, 'Readiness');
  assert.equal(readyView.tone, 'ready');
  assert.equal(readyView.summary, 'Ready for review.');
  assert.deepEqual(readyView.rows, [
    { label: 'Flag', value: 'ENABLED' },
    { label: 'Evidence', value: 'Attached' }
  ]);
  assert.deepEqual(readyView.notes, []);

  const blockedView = buildAdminStatusSummaryView({
    title: 'Readiness',
    ready: false,
    summary: 'More review is required.',
    rows: [{ label: 'Flag', value: 'DISABLED' }],
    notes: ['Collect evidence first.']
  });

  assert.equal(blockedView.tone, 'blocked');
  assert.deepEqual(blockedView.notes, ['Collect evidence first.']);

  console.log('admin-status-summary-view.test.ts passed');
}
