import assert from 'node:assert/strict';

import { p36c6 } from '../../lib/settings/p36c6';

export async function runP36C6CheckTests() {
  const v = p36c6();
  assert.equal(v.p, 36);
  assert.equal(v.c, 6);
  console.log('p36c6-check.test.ts passed');
}
