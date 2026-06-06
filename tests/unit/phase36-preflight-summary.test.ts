import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildPhase36PreflightSummary } from '../../lib/settings/phase36-preflight-summary';

export async function runPhase36PreflightSummaryTests() {
  const summary = buildPhase36PreflightSummary();
  const doc = readFileSync('docs/production-roadmap-phase36-outbound-preflight-progress.md', 'utf8');

  assert.equal(summary.phase, 36);
  assert.equal(summary.runtimeEnabled, false);
  assert.equal(summary.coverageCount, 7);
  assert.deepEqual(summary.slices, [
    'model-alignment-preflight',
    'read-adapter-preflight',
    'visibility-preflight',
    'route-core-preflight',
    'admin-readonly-preflight',
    'signing-preflight',
    'recovery-preflight'
  ]);

  assert.ok(doc.includes('PR 339'));
  assert.ok(doc.includes('Summary coverage'));
  assert.ok(doc.includes('storage boundary'));
  assert.ok(doc.includes('read contract'));
  assert.ok(doc.includes('admin visibility'));
  assert.ok(doc.includes('signing'));
  assert.ok(doc.includes('recovery'));
  assert.ok(doc.includes('preflight-only'));

  console.log('phase36-preflight-summary.test.ts passed');
}
