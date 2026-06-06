import assert from 'node:assert/strict';

import { buildPhase36SequenceMarker } from '../../lib/settings/phase36-sequence-marker';

export async function runPhase36SequenceMarkerTests() {
  const marker = buildPhase36SequenceMarker();

  assert.equal(marker.phase, 36);
  assert.equal(marker.checkpoint, 'sequence-marker');
  assert.deepEqual(marker.completed, ['storage-boundary', 'read-contract', 'admin-visibility']);
  assert.deepEqual(marker.next, ['status-groups', 'model-alignment', 'read-adapter']);

  console.log('phase36-sequence-marker.test.ts passed');
}
