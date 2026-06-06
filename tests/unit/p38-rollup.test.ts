import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runP38RollupTests() {
  const rollupDoc = readFileSync('docs/phase38-rollup.md', 'utf8');
  const closeoutDoc = readFileSync('docs/phase38-closeout.md', 'utf8');
  const implementationPlanDoc = readFileSync('docs/phase38-implementation-plan.md', 'utf8');

  for (const marker of ['PR 351', 'PR 352', 'PR 354', 'PR 355', 'phase: 38', 'runtime: false', 'storage: false', 'delivery: false', 'external_calls: false']) {
    assert.ok(rollupDoc.includes(marker), `rollup doc must include ${marker}`);
  }

  for (const marker of [
    'planning/readiness closeout only',
    'PR 351',
    'PR 352',
    'PR 354',
    'PR 355',
    'PR 356',
    'PR 357',
    'next_phase_planning_required: true',
    'implementation_plan_required: true',
    'runtime_enabled: false',
    'storage_enabled: false',
    'delivery_enabled: false',
    'external_calls_enabled: false',
  ]) {
    assert.ok(closeoutDoc.includes(marker), `closeout doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only implementation handoff',
    'structured logging plan',
    'incident runbook planning',
    'health-check inventory planning',
    'performance-pass planning',
    'implementation_plan_required: true',
    'branch_per_slice_required: true',
    'exact_head_ci_required: true',
    'runtime_enabled: false',
    'storage_enabled: false',
    'delivery_enabled: false',
    'external_calls_enabled: false',
    'operator_actions_enabled: false',
    'live behavior changes',
  ]) {
    assert.ok(implementationPlanDoc.includes(marker), `implementation plan doc must include ${marker}`);
  }

  console.log('p38-rollup.test.ts passed');
}
