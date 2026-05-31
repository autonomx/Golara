import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

export async function runAdminActionBoundaryGuardTests() {
  const result = spawnSync(process.execPath, ['tools/check-admin-action-boundaries.mjs'], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /admin action service-boundary checks passed \(2 files\)/);

  console.log('admin-action-boundary-guard.test.ts passed');
}
