import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

export async function runAdminActionBoundaryGuardTests() {
  const result = spawnSync(process.execPath, ['tools/check-action-boundaries.mjs'], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /action service-boundary checks passed(?: \(3 files\)| with legacy allowlist)/);

  console.log('admin-action-boundary-guard.test.ts passed');
}
