# Admin sign-in throttle hardening

This production security slice adds a runtime throttle to the shared admin session creation path.

## Scope

- Repeated invalid admin sign-in attempts are tracked in memory.
- After five failures inside the throttle window, further attempts are blocked for the lock window.
- A successful sign-in clears the throttle state.
- The throttle is applied before the admin session cookie is created.

## Notes

This is intentionally a runtime hardening slice without a database migration. A future slice can add persistent, IP-aware admin auth event logging if the admin panel needs multi-instance lockout state across deployments.
