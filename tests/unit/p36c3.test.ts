import assert from 'node:assert/strict';

import { p36c3 } from '../../lib/settings/p36c3';

export async function runP36C3Tests() {
  const v = p36c3();
  assert.equal(v.p, 36);
  assert.equal(v.c, 3);
  assert.equal(v.name, 'adapter-prep');
  console.log('p36c3.test.ts passed');
}
