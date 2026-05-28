# Golara Architecture

This folder contains detailed architecture design notes for the Golara storefront, CMS, customer account, catalog, checkout, media, and production-readiness systems.

## Documents

- [System architecture](./SYSTEM_ARCHITECTURE.md) — current production architecture, major modules, data flow, boundaries, and follow-up design direction.

## Documentation principles

- Keep architecture documents close to the code and update them with each major phase.
- Document current behavior separately from planned behavior.
- Prefer explicit module boundaries, data ownership, and operational notes over vague diagrams.
- Avoid copying vendor/source-site implementation details. Golara should use owned architecture and owned/generated assets.

## Suggested future documents

- `CATALOG_ARCHITECTURE.md` — category/product/media model and CMS editing flows.
- `CHECKOUT_ARCHITECTURE.md` — cart, checkout order, payment attempt, fulfillment, and order timeline flows.
- `CUSTOMER_ACCOUNT_ARCHITECTURE.md` — phone OTP login, sessions, profile, address book, and account security.
- `MEDIA_ARCHITECTURE.md` — local uploads, generated seed assets, image routes, and future object storage.
- `DEPLOYMENT_ARCHITECTURE.md` — environment variables, migrations, seed workflow, CI, hosting, and production launch checklist.
