import assert from 'node:assert/strict';

import { p37Chain } from '../../lib/settings/p37-chain';

export async function runP37ChainTests() {
  const chain = p37Chain();

  assert.equal(chain.p, 37);
  assert.equal(chain.step, 'chain');
  assert.equal(chain.ready, true);
  assert.equal(chain.count, 7);
  assert.equal(chain.enabled, false);

  console.log('p37-chain.test.ts passed');
}
