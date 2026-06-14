# Public Abuse Throttling Policy

This policy defines the production decision points for Golara public-abuse throttles. It complements `docs/PRODUCTION_SECURITY_DEPLOYMENT_CHECKLIST.md` and the security audit roadmap.

## Scope

Covered flows:

- public order lookup attempts;
- public inquiry submissions and cooldowns;
- cart add/update/clear mutation bursts;
- customer OTP request and verification throttles;
- admin login throttles where public traffic can reach the login surface.

Throttle evidence must stay bounded and redacted. Do not store raw order tokens, cart line keys, customer phone/email/name/message fields, OTPs, cookies, IP addresses, user-agent strings, provider references, webhook bodies, or request bodies in policy evidence, release notes, logs, or incident notes.

## Current implementation posture

The current runtime uses in-process throttles for several public surfaces and records bounded/redacted security events for throttle and cooldown outcomes. This is acceptable for single-instance or low-scale deployments when paired with upstream edge protection.

For multi-instance deployments, in-process throttles are not globally consistent. They may undercount requests distributed across instances and should be treated as a defense-in-depth layer, not the only production abuse control.

## Launch decision

Before production launch or any multi-instance scale-out, choose one of these positions and record it in release evidence:

1. **Accepted in-process risk** — allowed only for single-instance or low-traffic launches with documented edge controls, monitoring, owner, and review date.
2. **Distributed throttle required before launch** — use Redis, database-backed counters, managed WAF/rate limiting, or another centralized mechanism for the covered public flows.
3. **Hybrid policy** — keep in-process app throttles as local protection and enforce global thresholds at the edge or shared backing store.

## Distributed throttle requirements

Any distributed/persistent throttle implementation must:

- hash or otherwise tokenize customer/order/cart identifiers before storage;
- avoid raw IP/user-agent persistence unless legal/privacy review explicitly approves it;
- use bounded key cardinality and TTLs to prevent unbounded storage growth;
- enforce deny decisions before expensive database lookups or mutation work where practical;
- preserve existing same-origin, validation, and session/security boundaries;
- emit only bounded/redacted security events;
- include tests for allow, deny, reset/TTL, and redaction behavior;
- define operational dashboards and alert thresholds for spikes.

## Review cadence

Review this policy:

- before enabling production traffic;
- before increasing instance count or changing deployment topology;
- after abuse incidents or suspicious public-traffic spikes;
- when adding new public search, listing, inquiry, OTP, cart, or order lookup surfaces.

Record open risks with an owner, severity, mitigation, and target date. Do not include sensitive raw evidence in the risk record.
