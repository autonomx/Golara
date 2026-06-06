import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildPhase37OutboundQaKickoff } from '../../lib/settings/phase37-outbound-qa-kickoff';

export async function runPhase37OutboundQaKickoffTests() {
  const kickoff = buildPhase37OutboundQaKickoff();
  const doc = readFileSync('docs/production-roadmap-phase37-outbound-qa-kickoff.md', 'utf8');

  assert.equal(kickoff.phase, 37);
  assert.equal(kickoff.slice, 'outbound-qa-kickoff');
  assert.equal(kickoff.phase36CoverageCount, 7);
  assert.equal(kickoff.phase36RuntimeEnabled, false);
  assert.equal(kickoff.qaReady, true);

  assert.ok(doc.includes('Phase 37'));
  assert.ok(doc.includes('QA readiness'));
  assert.ok(doc.includes('Phase 36'));
  assert.ok(doc.includes('runtime behavior remains disabled'));

  console.log('phase37-outbound-qa-kickoff.test.ts passed');
}
