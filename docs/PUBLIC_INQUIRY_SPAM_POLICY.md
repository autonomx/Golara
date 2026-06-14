# Public Inquiry Spam and Anti-Automation Policy

This policy defines the production decision record for Golara public inquiry spam controls. It complements the public abuse throttling policy and the production security deployment checklist.

Do not store raw customer PII, full inquiry messages, IP addresses, user-agent strings, cookies, tokens, or captcha/vendor payloads in policy evidence, dashboards, alerts, or incident notes. Use bounded counts, hashed identifiers, redacted event metadata, and short decision summaries.

## Current baseline

Golara public inquiry submission must retain these baseline controls before production traffic:

- Same-origin validation occurs before inquiry validation or service work.
- Cooldown enforcement occurs before expensive persistence or notification work.
- Inquiry field lengths are bounded server-side and mirrored in the storefront form.
- Public-abuse security events are bounded/redacted and do not include raw email, phone, address, message, cookies, or request payloads.
- Monitoring can surface inquiry cooldown spikes and unusual public inquiry volume.

## Launch decision

Choose one decision before production launch or after material inquiry abuse:

1. **Baseline accepted** — same-origin, cooldown, bounds, and monitoring are accepted for launch.
2. **Additional anti-automation required** — add a challenge, proof-of-work, edge rule, or provider-based spam filter before launch.
3. **Escalation-only** — launch with baseline controls, but pre-approve additional controls if alert thresholds are exceeded.

Record the selected decision in release sign-off with owner, date, rationale, and review date.

## When to require stronger controls

Require stronger controls if any of these are true:

- Inquiry cooldowns repeatedly spike above the alert threshold.
- Operators receive repeated low-quality or automated inquiries despite cooldowns.
- Inquiry submissions create material email/SMS/provider cost.
- Abuse originates from many source networks where local cooldowns are ineffective.
- Legal/compliance requirements require stronger bot mitigation for public contact surfaces.

## Acceptable additional controls

Allowed controls include:

- Edge/WAF rate rules for inquiry POST paths.
- Distributed throttling keyed by hashed identifiers.
- Low-friction challenge only after suspicious behavior.
- Provider-side spam scoring if payload handling is privacy-reviewed.
- Temporary public inquiry disablement during active incident response.

Any challenge or provider integration must document:

- data sent to the provider;
- retention and deletion expectations;
- user-visible failure behavior;
- accessibility considerations;
- fallback or bypass path for legitimate customers;
- monitoring and false-positive review.

## Evidence and monitoring

Release or incident evidence may include:

- aggregate inquiry counts;
- aggregate cooldown/blocked counts;
- bounded event names and outcomes;
- hashed bucket counts;
- alert timestamps and owner acknowledgements;
- redacted screenshots of dashboards.

Evidence must not include raw inquiry content, names, email addresses, phone numbers, IP addresses, user-agent strings, cookies, tokens, or full request payloads.

## Review cadence

Review this policy before launch, after any inquiry-abuse incident, and whenever a new inquiry provider, notification channel, or public contact surface is added.
