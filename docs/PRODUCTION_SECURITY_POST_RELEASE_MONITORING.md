# Production Security Post-Release Monitoring

Use this checklist after a production release or material security-control change. It complements the pre-release deployment checklist, incident response runbook, and release sign-off template.

Keep monitoring notes bounded. Record sanitized dashboard links, bounded counts, owners, and decisions instead of copying sensitive production data.

## First-hour watch

- [ ] Confirm the deployed commit or artifact matches the signed-off release record.
- [ ] Confirm production health checks, storefront pages, admin login, account login, cart, checkout, payment callback, and webhook endpoints are reachable as expected.
- [ ] Review security-event dashboards for sudden spikes in admin login failures, admin authorization denials, OTP blocks, public order lookup throttles, inquiry cooldowns, cart mutation throttles, webhook signature failures, settlement mismatches, and suspicious media upload failures.
- [ ] Confirm CSP/header checks or equivalent production-like route smoke checks are still passing for storefront, account, and admin route families.
- [ ] Confirm alert destinations and escalation owners are receiving test or expected low-volume signals.

## First-day watch

- [ ] Review payment provider dashboards for webhook delivery failures, retries, settlement mismatches, duplicate events, and unexpected callback patterns.
- [ ] Review public-abuse controls for unusual throttle rates, enumeration patterns, or inquiry spam trends.
- [ ] Review media upload outcomes for rejected file types, suspicious MIME/signature mismatches, malware-scan outcomes if enabled, and metadata-stripping decisions if applicable.
- [ ] Review dependency, package-integrity, and license policy exceptions that were accepted during release sign-off and verify no expiry or mitigation owner is missing.
- [ ] Confirm backup jobs, restore-test schedule, and recovery owner assignments remain valid after the release.

## Escalation triggers

Open an incident or release-blocking follow-up if any of the following occur:

- Payment state changes appear without expected settlement, currency, order, or provider-reference corroboration.
- Public APIs expose customer, payment, provider, or internal metadata outside documented allowlists.
- Security-event dashboards show sustained spikes that cannot be explained by expected traffic.
- Webhook signature failures, replay attempts, duplicate events, or settlement mismatches increase materially.
- CSP/header checks fail on a production route family.
- Backup, restore, logging, alerting, or incident-response access is unavailable to the expected operators.

## Monitoring evidence fields

Record only bounded evidence in the release tracker or evidence index:

- release identifier, commit SHA, deployment URL or sanitized dashboard link
- observation window and reviewer
- dashboard/query link or bounded count summary
- decision: clean, monitor, follow-up, rollback, or incident
- owner and target date for follow-up work
- related PR, issue, incident, or release-signoff reference
