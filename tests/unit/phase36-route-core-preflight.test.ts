import assert from 'node:assert/strict';

import { buildPhase36AdminReadonlyPreflight } from '../../lib/settings/phase36-admin-readonly-preflight';
import { buildPhase36RouteCorePreflight } from '../../lib/settings/phase36-route-core-preflight';

export async function runPhase36RouteCorePreflightTests() {
  const routeCore = buildPhase36RouteCorePreflight();
  assert.equal(routeCore.phase, 36);
  assert.equal(routeCore.slice, 'route-core-preflight');
  assert.equal(routeCore.readAdapterRequired, true);
  assert.equal(routeCore.routeRuntimeEnabled, false);
  assert.deepEqual(routeCore.checkpoints, ['adapter-required', 'read-only-contract', 'runtime-disabled']);

  const admin = buildPhase36AdminReadonlyPreflight();
  assert.equal(admin.phase, 36);
  assert.equal(admin.slice, 'admin-readonly-preflight');
  assert.equal(admin.routeCoreRequired, true);
  assert.equal(admin.displayOnly, true);
  assert.equal(admin.actionRuntimeEnabled, false);
  assert.deepEqual(admin.checkpoints, ['route-core-required', 'display-only', 'actions-disabled']);

  console.log('phase36-route-core-preflight.test.ts passed');
}
