import assert from 'node:assert/strict';

import { p37State } from '../../lib/settings/p37-state';

export async function runP37StateTests() {
  const state = p37State();

  assert.equal(state.p, 37);
  assert.equal(state.ready, true);
  assert.equal(state.count, 7);
  assert.equal(state.enabled, false);

  console.log('p37-state.test.ts passed');
}
