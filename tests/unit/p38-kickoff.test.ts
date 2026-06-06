import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getPhase38Kickoff } from '../../lib/settings/p38-kickoff';

export async function runP38KickoffTests() {
  const kickoff = getPhase38Kickoff();
  const doc = readFileSync('docs/phase38-kickoff.md', 'utf8');

  assert.equal(kickoff.phase, 38);
  assert.equal(kickoff.planning, true);
  assert.equal(kickoff.runtime, false);
  assert.equal(kickoff.storage, false);
  assert.equal(kickoff.delivery, false);
  assert.equal(kickoff.source, 'phase37');

  for (const marker of ['PR 351', 'phase: 38', 'planning: true', 'runtime: false', 'storage: false', 'delivery: false', 'source: phase37']) {
    assert.ok(doc.includes(marker), `doc must include ${marker}`);
  }

  console.log('p38-kickoff.test.ts passed');
}
