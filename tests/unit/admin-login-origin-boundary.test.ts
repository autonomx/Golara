import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runAdminLoginOriginBoundaryTests() {
  const loginAction = readFileSync('app/admin/login/actions.ts', 'utf8');
  const originGuard = readFileSync('lib/server-action-origin.ts', 'utf8');

  assert.match(loginAction, /assertSameOriginServerAction/);
  assert.match(loginAction, /await assertSameOriginServerAction\(\);[\s\S]*createAdminSession/);
  assert.match(originGuard, /headers/);
  assert.match(originGuard, /origin/);
  assert.match(originGuard, /x-forwarded-host/);
  assert.match(originGuard, /x-forwarded-proto/);
  assert.match(originGuard, /submittedOrigin !== requestOrigin/);
  assert.doesNotMatch(loginAction, /createAdminSession[\s\S]*assertSameOriginServerAction/);

  console.log('admin-login-origin-boundary.test.ts passed');
}
