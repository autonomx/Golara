import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readDoc(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

export async function runOutboundWebhookPhase35CloseoutTests() {
  const closeout = readDoc('docs/production-roadmap-phase35-closeout.md');
  const helperContract = readDoc('docs/production-roadmap-phase35-admin-read-helper-contract.md');

  const closeoutPhrases = [
    'Phase 35 repo-side foundation is complete',
    'runtime delivery remains disabled',
    'Future runtime work must be split into narrow PRs',
    'The first Phase 36 slice should start with storage or migration foundations only',
    'Add the additive outbound delivery migration with no live sends',
    'storage-backed read repository or adapter',
    'route-core/admin read-only visibility'
  ];

  for (const phrase of closeoutPhrases) {
    assert.ok(closeout.includes(phrase), `Phase 35 closeout note must mention ${phrase}`);
  }

  const deferredRuntimePhrases = [
    'persistence implementation',
    'storage-backed reads and writes',
    'route handlers',
    'admin pages',
    'background processing',
    'retry execution',
    'signing runtime',
    'outbound delivery',
    'admin recovery controls',
    'production-ready outbound delivery claims'
  ];

  for (const phrase of deferredRuntimePhrases) {
    assert.ok(closeout.includes(phrase), `Phase 35 closeout note must defer ${phrase}`);
  }

  assert.ok(helperContract.includes('pure helper contract'));
  assert.ok(helperContract.includes('does not add storage access, endpoint handlers, admin pages, state mutation, external calls, signing, retry behavior, or recovery controls'));

  console.log('outbound-webhook-phase35-closeout.test.ts passed');
}
