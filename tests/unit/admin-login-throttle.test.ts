import assert from 'node:assert/strict';

import {
  ADMIN_SIGN_IN_LOCK_MS,
  ADMIN_SIGN_IN_MAX_FAILURES,
  ADMIN_SIGN_IN_WINDOW_MS,
  clearAdminSignInThrottle,
  isAdminSignInLocked,
  recordAdminSignInFailure,
  resetAdminSignInThrottleForTests
} from '../../lib/admin-login-throttle';

export async function runAdminLoginThrottleTests() {
  resetAdminSignInThrottleForTests();

  const key = 'admin-login-test';
  const start = 1_700_000_000_000;

  assert.equal(isAdminSignInLocked(key, start), false);

  for (let attempt = 1; attempt < ADMIN_SIGN_IN_MAX_FAILURES; attempt += 1) {
    const state = recordAdminSignInFailure(key, start + attempt);
    assert.equal(state.failures, attempt);
    assert.equal(isAdminSignInLocked(key, start + attempt), false);
  }

  const locked = recordAdminSignInFailure(key, start + ADMIN_SIGN_IN_MAX_FAILURES);
  assert.equal(locked.failures, ADMIN_SIGN_IN_MAX_FAILURES);
  assert.equal(locked.lockedUntil, start + ADMIN_SIGN_IN_MAX_FAILURES + ADMIN_SIGN_IN_LOCK_MS);
  assert.equal(isAdminSignInLocked(key, start + ADMIN_SIGN_IN_MAX_FAILURES + 1), true);
  assert.equal(isAdminSignInLocked(key, start + ADMIN_SIGN_IN_MAX_FAILURES + ADMIN_SIGN_IN_LOCK_MS + 1), false);

  clearAdminSignInThrottle(key);
  assert.equal(isAdminSignInLocked(key, start), false);

  const resetKey = 'admin-login-reset-window';
  recordAdminSignInFailure(resetKey, start);
  const resetState = recordAdminSignInFailure(resetKey, start + ADMIN_SIGN_IN_WINDOW_MS + 1);
  assert.equal(resetState.failures, 1);
  assert.equal(resetState.firstFailureAt, start + ADMIN_SIGN_IN_WINDOW_MS + 1);

  resetAdminSignInThrottleForTests();
  console.log('admin-login-throttle.test.ts passed');
}

runAdminLoginThrottleTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
