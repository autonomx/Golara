import assert from 'node:assert/strict';

import { buildPhase36StatusGroups } from '../../lib/settings/phase36-status-groups';

export async function runPhase36StatusGroupsTests() {
  const groups = buildPhase36StatusGroups();

  assert.equal(groups.phase, 36);
  assert.deepEqual(groups.initial, ['planned']);
  assert.deepEqual(groups.active, ['pending', 'retry_wait']);
  assert.deepEqual(groups.terminal, ['delivered', 'failed', 'dead_letter']);
  assert.deepEqual(groups.notes, ['classification-only']);

  console.log('phase36-status-groups.test.ts passed');
}
