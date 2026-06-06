import assert from 'node:assert/strict';

import { p36c2 } from '../../lib/settings/p36c2';

export async function runP36C2Tests() {
  const v = p36c2();
  assert.equal(v.p, 36);
  assert.equal(v.c, 2);
  console.log('p36c2.test.ts passed');
}
