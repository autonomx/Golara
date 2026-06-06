import assert from 'node:assert/strict';

import { buildPhase37EvidencePlanning } from '../../lib/settings/phase37-evidence-planning';

export async function runPhase37EvidenceStateTests() {
  const evidence = buildPhase37EvidencePlanning();

  assert.equal(evidence.phase, 37);
  assert.equal(evidence.slice, 'evidence-planning');
  assert.equal(evidence.coverageProofRequired, true);
  assert.equal(evidence.boundaryProofRequired, true);
  assert.equal(evidence.reviewProofRequired, true);
  assert.equal(evidence.runtimeEnabled, false);
  assert.equal(evidence.coverageCount, 7);

  console.log('phase37-evidence-state.test.ts passed');
}
