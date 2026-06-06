import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runP38RollupTests() {
  const doc = readFileSync('docs/phase38-rollup.md', 'utf8');

  for (const marker of ['PR 351', 'PR 352', 'PR 354', 'phase: 38', 'runtime: false', 'storage: false', 'delivery: false', 'external_calls: false']) {
    assert.ok(doc.includes(marker), `doc must include ${marker}`);
  }

  console.log('p38-rollup.test.ts passed');
}
