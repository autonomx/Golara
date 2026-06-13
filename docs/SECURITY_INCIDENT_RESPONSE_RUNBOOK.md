# Security Incident Response Runbook

This runbook defines the default response process for suspected security incidents in Golara production. It is intentionally operational and conservative: preserve evidence, contain risk, avoid leaking sensitive data, and keep customer-facing actions coordinated.

## Scope

Use this runbook for suspected or confirmed incidents involving:

- account/session compromise;
- admin authorization failures or privilege misuse;
- OTP abuse, public-order lookup abuse, inquiry spam, or cart-abuse spikes;
- payment webhook replay, settlement mismatch, callback tampering, refund/void anomalies, or provider credential exposure;
- customer/contact/address/payment data exposure;
- media upload/path traversal/unsafe URL issues;
- committed secrets, dependency compromise, or suspicious CI/deployment activity.

## Severity levels

| Severity | Examples | Default response target |
| --- | --- | --- |
| SEV-1 | Active data exposure, payment compromise, leaked production secret, confirmed admin takeover | Immediate containment and leadership/customer-impact assessment |
| SEV-2 | Exploitable auth/payment flaw without confirmed data exposure, high-volume abuse bypassing throttles | Same-day containment and remediation plan |
| SEV-3 | Blocked abuse, suspicious but unconfirmed activity, non-production secret exposure | Triage, monitor, and schedule remediation |
| SEV-4 | Low-risk policy/documentation gap or benign scanner finding | Track in roadmap/backlog |

Escalate severity if payment integrity, customer PII, admin credentials, provider secrets, or production availability are affected.

## First responder checklist

1. Open an incident record with start time, reporter, suspected surface, severity, and initial hypothesis.
2. Preserve evidence before changing state: relevant request IDs, security-event records, admin/auth logs, webhook event IDs, payment attempt/order IDs, deployment SHA, and CI run IDs.
3. Do not paste secrets, raw OTPs, full customer contact data, full provider references, raw webhook bodies, cookies, bearer tokens, or database dumps into chat, tickets, or logs.
4. Assign an incident lead and a separate communications owner for SEV-1/SEV-2.
5. Freeze non-essential production changes until containment is understood.

## Triage data sources

Use the safest available identifiers first:

- bounded admin security events for login, authorization denial, and throttle outcomes;
- bounded public-abuse events for order lookup, inquiry cooldown, and cart throttles;
- customer auth event hashes for OTP request/verify allow/block outcomes;
- payment webhook security events for duplicate replay, missing attempt, settlement mismatch, and state-transition outcomes;
- order timeline and admin audit metadata for payment status/refund/void transitions;
- route-smoke/header CI artifacts and deployment SHA for deployment regressions;
- dependency audit and secret-scan CI results for supply-chain findings.

When correlating records, prefer hashed identifiers, order numbers, payment attempt IDs, and bounded event metadata. Access raw customer/provider data only when necessary for containment or legally required investigation.

## Containment playbooks

### Account, session, or admin compromise

1. Disable or rotate affected admin/customer sessions.
2. Rotate relevant auth secrets if signing keys, cookies, tokens, or credentials may be exposed.
3. Review recent admin actions, owner-only mutation attempts, and authorization-denial events.
4. Temporarily restrict sensitive admin actions if misuse is ongoing.

### OTP or public abuse spike

1. Confirm throttle/cooldown events are being recorded.
2. Identify affected hashed phone/IP/user-agent buckets.
3. Increase temporary edge/WAF/rate-limit controls if in-process throttles are insufficient for multi-instance traffic.
4. Avoid blocking broad customer populations unless abuse is active and severe.

### Payment webhook, callback, refund, or settlement anomaly

1. Pause risky provider flows if spoofing/replay/settlement mismatch is active.
2. Preserve provider event IDs, payment attempt IDs, order numbers, settlement metadata, and webhook security events.
3. Verify settlement amount/currency and provider-reference corroborators before any manual state correction.
4. Use owner-only manual payment/refund tools for corrections and keep audit metadata bounded.
5. Reconcile affected orders against provider dashboards before customer notification or fulfillment changes.

### Data exposure or privacy issue

1. Identify exposed fields, affected routes/pages/API responses, and affected time window.
2. Preserve response samples with sensitive fields redacted.
3. Remove or gate the exposure path before broad investigation if exposure is active.
4. Assess customer notification and regulatory obligations with counsel/leadership.

### Secret or supply-chain issue

1. Revoke/rotate exposed credentials immediately.
2. Audit recent CI runs, dependency lockfile changes, deployments, and package advisory status.
3. Redeploy from a known-good commit after rotation if runtime compromise is plausible.
4. Add regression coverage or CI gates before closing the incident.

## Communication rules

- Use a single incident lead for status updates.
- Keep customer-facing statements factual and time-bounded.
- Do not speculate about data exposure before evidence review.
- For SEV-1/SEV-2, prepare an external summary covering impact, containment, remediation, and follow-up actions.
- Keep internal notes redacted; link to secure systems of record instead of copying sensitive payloads.

## Recovery and validation

Before closing an incident:

1. Confirm containment is complete and no active exploit path remains.
2. Validate the fix with CI gates, focused regression tests, and production-like smoke checks where relevant.
3. Review logs/events after deployment for recurrence.
4. Rotate any credentials that were possibly exposed.
5. Reconcile affected orders/payments/customer records.
6. Update this runbook or the security roadmap if a new control class is needed.

## Post-incident review

Within five business days for SEV-1/SEV-2, record:

- timeline from detection to containment and recovery;
- root cause and contributing factors;
- customer/payment/data impact assessment;
- what controls worked and what failed;
- follow-up owners and due dates;
- tests, source gates, monitoring, runbook, or deployment changes added to prevent recurrence.

## Minimum closure criteria

An incident can close only when:

- evidence is preserved and summarized;
- impact is assessed and communicated through the appropriate channel;
- fixes are merged and deployed, or risk is explicitly accepted with owner approval;
- required secrets/sessions are rotated or revoked;
- monitoring shows no recurrence;
- follow-up roadmap items are filed for any deferred work.
