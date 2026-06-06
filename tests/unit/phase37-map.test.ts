import assert from 'node:assert/strict';

import { buildPhase37QaCoverageMap } from '../../lib/settings/phase37-qa-coverage-map';

export async function runPhase37MapTests() {
  const map = buildPhase37QaCoverageMap();

  assert.equal(map.phase, 37);
  assert.equal(map.phase36CoverageCount, 7);
  assert.equal(map.phase37Ready, true);
  assert.equal(map.runtimeEnabled, false);

  console.log('phase37-map.test.ts passed');
}
