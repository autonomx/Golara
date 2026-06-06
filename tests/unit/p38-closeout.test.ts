import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runP38CloseoutTests() {
  const doc = readFileSync('docs/phase38-closeout.md', 'utf8');

  for (const marker of [
    'planning/readiness closeout only',
    'PR 351',
    'PR 352',
    'PR 354',
    'PR 355',
    'PR 356',
    'next_phase_planning_required: true',
    'implementation_plan_required: true',
    'runtime_enabled: false',
    'storage_enabled: false',
    'delivery_enabled: false',
    'external_calls_enabled: false',
  ]) {
    assert.ok(doc.includes(marker), `doc must include ${marker}`);
  }

  console.log('p38-closeout.test.ts passed');
}
