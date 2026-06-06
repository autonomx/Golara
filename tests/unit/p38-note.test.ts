import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runP38NoteTests() {
  const doc = readFileSync('docs/phase38-note.md', 'utf8');

  for (const marker of ['phase: 38', 'runtime: false', 'storage: false', 'delivery: false', 'external_calls: false']) {
    assert.ok(doc.includes(marker), `doc must include ${marker}`);
  }

  console.log('p38-note.test.ts passed');
}
