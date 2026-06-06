import assert from 'node:assert/strict';

import { buildPhase36ModelAlignmentPreflight } from '../../lib/settings/phase36-model-alignment-preflight';

export async function runPhase36ModelAlignmentPreflightTests() {
  const preflight = buildPhase36ModelAlignmentPreflight();

  assert.equal(preflight.phase, 36);
  assert.equal(preflight.slice, 'model-alignment-preflight');
  assert.equal(preflight.schemaEditReady, false);
  assert.equal(preflight.generatedClientRequired, true);
  assert.equal(preflight.runtimeUseEnabled, false);
  assert.deepEqual(preflight.checkpoints, ['migration-present', 'model-pending', 'client-validation-required']);

  console.log('phase36-model-alignment-preflight.test.ts passed');
}
