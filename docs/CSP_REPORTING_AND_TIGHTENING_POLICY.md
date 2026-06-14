# CSP Reporting and Tightening Policy

This policy defines how Golara reviews, monitors, and tightens Content Security Policy controls for production deployments.

## Goals

- Keep browser execution, framing, connection, image, font, and form-post surfaces intentionally bounded.
- Make CSP exceptions reviewable and tied to required storefront, admin, media, analytics, or payment-provider behavior.
- Avoid breaking checkout/payment flows while still reducing broad allowances over time.
- Capture CSP violation evidence without storing secrets, cookies, tokens, customer PII, provider references, full URLs with sensitive paths, or request bodies.

## Launch decision

Before launch or major traffic changes, choose and record one of these decisions in release evidence:

1. **Report-only monitoring first** — deploy a `Content-Security-Policy-Report-Only` policy or provider equivalent for a bounded observation window before enforcing tightened directives.
2. **Enforced baseline accepted** — keep the current enforced CSP because route smoke and manual verification cover the release scope; document known allowances and owners.
3. **Tightening required before launch** — block launch until high-risk allowances are removed or reduced.

## Required review for each CSP allowance

For every non-self source or broad allowance, record:

- directive name, such as `script-src`, `style-src`, `img-src`, `connect-src`, `frame-src`, or `form-action`;
- allowed origin or keyword;
- business need and owning area;
- affected storefront/admin/payment/media flow;
- whether the allowance is temporary or permanent;
- target removal or review date where practical.

## Tightening priorities

Review in this order:

1. Remove unused third-party origins.
2. Narrow wildcard hosts to exact origins.
3. Reduce `unsafe-inline` and `unsafe-eval` where framework/runtime constraints allow.
4. Keep payment-provider and media-provider allowances scoped to required endpoints only.
5. Keep `frame-ancestors` restrictive and avoid broad framing allowances.
6. Keep `form-action` restricted to self and explicitly required provider endpoints.

## Reporting requirements

If CSP reporting is enabled:

- report endpoints must reject oversized payloads;
- reports must be sampled or rate-limited before storage/alerting;
- reports must strip or hash sensitive URL paths/query strings before persistence;
- dashboards must show directive, blocked origin/scheme, route class, count, first seen, and last seen rather than raw request details;
- alerts must focus on new high-risk directives, sudden spikes, or violations on checkout/admin/payment routes.

## Validation checklist

Before a tightened CSP ships:

- route smoke or equivalent production-like checks pass;
- checkout, payment return, public order lookup, admin login, admin order operations, media upload/rendering, and inquiry flows are manually or automatically verified;
- any new provider/domain allowance is documented with owner and review date;
- violation reports contain no raw secrets, cookies, tokens, OTPs, PII, provider references, webhook payloads, or database dumps;
- rollback steps are documented if legitimate traffic is blocked.

## Ownership

The release owner is responsible for recording the CSP decision. Security or platform owners must review new broad allowances, new third-party script origins, and any CSP report storage/alerting changes before production rollout.
