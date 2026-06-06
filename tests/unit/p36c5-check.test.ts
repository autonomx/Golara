import assert from 'node:assert/strict';

import { p36c5 } from '../../lib/settings/p36c5';

export async function runP36C5CheckTests() {
  const v = p36c5();
  assert.equal(v.p, 36);
  assert.equal(v.c, 5);
  console.log('p36c5-check.test.ts passed');
}
