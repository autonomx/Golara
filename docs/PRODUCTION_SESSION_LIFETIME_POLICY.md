# Production Session Lifetime Policy

This policy defines the production decision record required for Golara admin and customer session lifetimes, renewal behavior, revocation, and privileged re-auth. It complements the security audit roadmap and production deployment checklist.

Do not store raw session tokens, cookies, OTPs, passwords, customer PII, provider references, or database dumps in policy evidence.

## 1. Required launch decision

Before production launch, record one approved option for each session class:

| Session class | Required decision | Evidence to record |
| --- | --- | --- |
| Admin session | Fixed lifetime, rolling renewal, or short privileged window | Lifetime value, renewal behavior, owner, approval date |
| Customer session | Fixed lifetime or rolling renewal | Lifetime value, renewal behavior, owner, approval date |
| OTP challenge/session bridge | Short-lived only | Expiry value, retry/abuse controls, owner |
| Privileged admin action | Existing admin session only or re-auth required | Covered actions, re-auth window, owner |
| Privileged customer action | Existing customer session only or re-auth required | Covered actions, re-auth window, owner |

If the decision is not yet finalized, launch evidence must explicitly mark the risk as open with an owner, severity, mitigation, and target date.

## 2. Baseline expectations

Production configuration should preserve these guardrails:

- Admin sessions are signed, rotate on login, and expire based on issued-at or stored expiry data.
- Customer sessions rotate on OTP login and never trust caller-supplied customer identifiers.
- Session lookup rejects revoked or expired customer session rows.
- Logout and revocation clear the browser-facing cookie shape used to set the session.
- Session evidence must reference configuration names or code paths, not raw cookie or token values.

## 3. Fixed vs rolling renewal

A fixed lifetime means the session expires at a deterministic time after creation. A rolling lifetime extends activity windows after validated use.

Use fixed lifetime when:

- predictable expiry is preferred;
- privileged access risk is high;
- renewal implementation does not yet have durable tests and audit coverage.

Use rolling renewal only when:

- renewal writes are idempotent and bounded;
- renewal does not extend revoked sessions;
- renewal does not mask suspicious activity;
- tests cover stale, revoked, malformed, future-dated, and tampered sessions;
- monitoring can detect renewal spikes or anomalous session churn.

## 4. Privileged re-auth policy

Privileged re-auth may be required for actions that materially change account, security, money, provider, or access-control state.

Candidate admin actions:

- staff/user management;
- API token creation or revocation;
- payment provider configuration;
- webhook secret management;
- destructive catalog/media/admin settings changes.

Candidate customer actions:

- changing contact details;
- changing shipping or billing address details;
- viewing sensitive order details beyond public-safe status;
- initiating payment or refund-sensitive flows if added later.

If re-auth is deferred, document the accepted risk and compensating controls, such as short fixed sessions, owner-only gates, audit events, and alerting.

## 5. Revocation and emergency response

Release evidence must identify how operators can revoke or invalidate:

- one customer session;
- all customer sessions for an account;
- one admin session;
- all admin sessions after suspected secret compromise;
- affected OTP challenges after abuse or provider compromise.

Emergency steps should reference the incident response runbook and must not require copying raw tokens into tickets or chat.

## 6. Monitoring and review

Monitoring should cover:

- admin login success/failure/throttle events;
- admin authorization-denial events;
- OTP request/verify block events;
- customer session revoke/expiry cleanup anomalies where logged;
- unusual session churn after deployment changes.

Review this policy when:

- session cookie attributes change;
- auth/session persistence changes;
- privileged re-auth is introduced;
- a new customer/admin surface exposes sensitive data;
- an incident or audit finding identifies session misuse.
