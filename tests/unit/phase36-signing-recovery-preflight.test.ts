import assert from 'node:assert/strict';

import { buildPhase36RecoveryPreflight } from '../../lib/settings/phase36-recovery-preflight';
import { buildPhase36SigningPreflight } from '../../lib/settings/phase36-signing-preflight';

export async function runPhase36SigningRecoveryPreflightTests() {
  const signing = buildPhase36SigningPreflight();
  assert.equal(signing.phase, 36);
  assert.equal(signing.slice, 'signing-preflight');
  assert.equal(signing.canonicalPayloadRequired, true);
  assert.equal(signing.secretSourceRequired, true);
  assert.equal(signing.signingRuntimeEnabled, false);
  assert.deepEqual(signing.checkpoints, ['canonical-payload-required', 'secret-source-required', 'runtime-disabled']);

  const recovery = buildPhase36RecoveryPreflight();
  assert.equal(recovery.phase, 36);
  assert.equal(recovery.slice, 'recovery-preflight');
  assert.equal(recovery.persistenceRequired, true);
  assert.equal(recovery.auditRequired, true);
  assert.equal(recovery.operatorRuntimeEnabled, false);
  assert.deepEqual(recovery.checkpoints, ['persistence-required', 'audit-required', 'operator-runtime-disabled']);

  console.log('phase36-signing-recovery-preflight.test.ts passed');
}
