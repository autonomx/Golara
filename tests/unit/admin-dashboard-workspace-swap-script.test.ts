import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export function runAdminDashboardWorkspaceSwapScriptTests() {
  const source = readFileSync('scripts/admin-dashboard-workspace-swap.mjs', 'utf8');

  assert.ok(source.includes('AdminDashboard workspace swap aborted'), 'swap script should fail loudly when dashboard markers drift');
  assert.ok(source.includes('AdminOverviewWorkspace'), 'swap script should wire the overview workspace');
  assert.ok(source.includes('AdminCatalogWorkspace'), 'swap script should wire the catalog workspace');
  assert.ok(source.includes('AdminContentWorkspace'), 'swap script should wire the content workspace');
  assert.ok(source.includes('Run typecheck and the localization/unit suites before committing'), 'swap script should remind maintainers to verify after applying the codemod');

  console.log('admin-dashboard-workspace-swap-script.test.ts passed');
}
