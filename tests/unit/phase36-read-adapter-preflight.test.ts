import assert from 'node:assert/strict';

import { buildPhase36ReadAdapterPreflight } from '../../lib/settings/phase36-read-adapter-preflight';
import { buildPhase36VisibilityPreflight } from '../../lib/settings/phase36-visibility-preflight';

export async function runPhase36ReadAdapterPreflightTests() {
  const adapter = buildPhase36ReadAdapterPreflight();
  assert.equal(adapter.phase, 36);
  assert.equal(adapter.slice, 'read-adapter-preflight');
  assert.equal(adapter.repositoryContractRequired, true);
  assert.equal(adapter.generatedClientRequired, true);
  assert.equal(adapter.adapterRuntimeEnabled, false);
  assert.deepEqual(adapter.checkpoints, ['contract-present', 'client-validation-required', 'runtime-disabled']);

  const visibility = buildPhase36VisibilityPreflight();
  assert.equal(visibility.phase, 36);
  assert.equal(visibility.slice, 'visibility-preflight');
  assert.equal(visibility.readAdapterRequired, true);
  assert.equal(visibility.displayOnly, true);
  assert.equal(visibility.operatorActionsEnabled, false);
  assert.deepEqual(visibility.checkpoints, ['adapter-required', 'display-only', 'operator-actions-disabled']);

  console.log('phase36-read-adapter-preflight.test.ts passed');
}
