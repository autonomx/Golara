import assert from 'node:assert/strict';

import { p37Review } from '../../lib/settings/p37-review';

export async function runP37ReviewTests() {
  const review = p37Review();

  assert.equal(review.p, 37);
  assert.equal(review.r, true);
  assert.equal(review.c, 7);
  assert.equal(review.e, false);

  console.log('p37-review.test.ts passed');
}
