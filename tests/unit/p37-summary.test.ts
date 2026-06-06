import assert from 'node:assert/strict';

import { p37Summary } from '../../lib/settings/p37-summary';

export async function runP37SummaryTests() {
  const summary = p37Summary();

  assert.equal(summary.p, 37);
  assert.equal(summary.s, 'summary');
  assert.equal(summary.ready, true);
  assert.equal(summary.count, 7);
  assert.equal(summary.enabled, false);

  console.log('p37-summary.test.ts passed');
}
