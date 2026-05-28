# Golara Architecture

This folder contains detailed architecture design notes for the Golara storefront, CMS, customer account, catalog, checkout, media, and production-readiness systems.

## Documents

- [System architecture](./SYSTEM_ARCHITECTURE.md) — current production architecture, major modules, data flow, boundaries, and follow-up design direction.
- [Architecture risk register](./RISK_REGISTER.md) — launch blockers, high-risk architecture decisions, and review follow-up priorities.
- [Architecture fix implementation roadmap](./ARCHITECTURE_FIX_ROADMAP.md) — implementation phases for resolving the architecture review concerns.
- [Checkout architecture](./CHECKOUT_ARCHITECTURE.md) — cart/order/payment/fulfillment state machines, idempotency, and inventory/capacity direction.
- [Deployment architecture](./DEPLOYMENT_ARCHITECTURE.md) — runtime mode contract, preview-vs-production fallback boundary, and environment setup.

## Documentation principles

- Keep architecture documents close to the code and update them with each major phase.
- Document current behavior separately from planned behavior.
- Prefer explicit module boundaries, data ownership, and operational notes over vague diagrams.
- Avoid copying vendor/source-site implementation details. Golara should use owned architecture and owned/generated assets.
- Treat launch-blocking risks as explicit architecture work, not as vague future improvements.

## Recommended next documents

The current priority order follows the architecture review: checkout state and OTP abuse prevention are launch blockers, and deployment mode safety must be settled before production.

1. `CUSTOMER_ACCOUNT_ARCHITECTURE.md` — phone OTP login, throttling, sessions, profile, address book, and account security.
2. `MEDIA_ARCHITECTURE.md` — local uploads, generated seed assets, image routes, alias migration, object storage, and CDN plan.
3. `CATALOG_ARCHITECTURE.md` — category/product/media model and CMS editing flows after localization persistence is decided.
4. `LOCALIZATION_ARCHITECTURE.md` — Persian/English copy storage, URL strategy, fallback behavior, and RTL QA.
