import 'server-only';

export const ADMIN_SIGN_IN_MAX_FAILURES = 5;
export const ADMIN_SIGN_IN_WINDOW_MS = 15 * 60 * 1000;
export const ADMIN_SIGN_IN_LOCK_MS = 15 * 60 * 1000;

export type AdminSignInThrottleState = {
  failures: number;
  firstFailureAt: number;
  lockedUntil?: number;
};

const attempts = new Map<string, AdminSignInThrottleState>();

export function isAdminSignInLocked(key: string, now = Date.now()) {
  const state = attempts.get(key);
  return Boolean(state?.lockedUntil && state.lockedUntil > now);
}

export function recordAdminSignInFailure(key: string, now = Date.now()) {
  const current = attempts.get(key);
  const base = current && now - current.firstFailureAt <= ADMIN_SIGN_IN_WINDOW_MS ? current : undefined;
  const failures = (base?.failures || 0) + 1;
  const next: AdminSignInThrottleState = {
    failures,
    firstFailureAt: base?.firstFailureAt || now,
    lockedUntil: failures >= ADMIN_SIGN_IN_MAX_FAILURES ? now + ADMIN_SIGN_IN_LOCK_MS : base?.lockedUntil
  };
  attempts.set(key, next);
  return next;
}

export function clearAdminSignInThrottle(key: string) {
  attempts.delete(key);
}

export function resetAdminSignInThrottleForTests() {
  attempts.clear();
}
