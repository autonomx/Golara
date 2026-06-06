import assert from 'node:assert/strict';

import { p36c4 } from '../../lib/settings/p36c4';

export async function runP36C4Tests() {
  const v = p36c4();
  assert.equal(v.p, 36);
  assert.equal(v.c, 4);
  console.log('p36c4.test.ts passed');
}
