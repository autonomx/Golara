import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runP37DocSummaryTests() {
  const doc = readFileSync('docs/phase37-summary.md', 'utf8');

  for (const pr of ['PR 342', 'PR 343', 'PR 344', 'PR 345', 'PR 346', 'PR 347', 'PR 348', 'PR 349']) {
    assert.ok(doc.includes(pr), `doc must include ${pr}`);
  }

  assert.ok(doc.includes('phase: 37'));
  assert.ok(doc.includes('ready: true'));
  assert.ok(doc.includes('count: 7'));
  assert.ok(doc.includes('enabled: false'));

  console.log('p37-doc-summary.test.ts passed');
}
