# Golara Architecture Risk Register

## Purpose

This document tracks architecture risks that should be treated as launch blockers or near-term design decisions, not vague future work.

It is based on the first architecture review of the Golara ecommerce/CMS system. The review found the current architecture healthy for this stage, especially the seeded/DB dual mode, recursive categories, provider seams, server-action admin writes, audit logging, and CMS-driven homepage categories. It also identified risks that will become expensive if deferred too long.

## Risk severity definitions

- **Blocker:** Must be designed and implemented before public production launch.
- **High:** Should be designed before the related feature expands or before payment/auth launch.
- **Medium:** Safe short-term, but should be resolved before the codebase grows significantly.
- **Low:** Documentation or maintainability improvement.

## Current top risks

| Risk | Severity | Area | Current state | Required direction |
| --- | --- | --- | --- | --- |
| OTP abuse / SMS toll fraud | Blocker | Customer auth | OTP challenge attempts exist, but IP/device throttling is not fully designed. | Add per-phone, per-IP, and verify-attempt throttling before public OTP launch. |
| Checkout state machine ambiguity | Blocker | Checkout/orders | Cart, order, payment attempt, and timeline records exist, but legal transitions are implicit. | Define order/payment/fulfillment states and idempotent transition rules. |
| Inventory and availability gap | Blocker | Catalog/checkout | `availableToday` exists, but no reservation or fulfillment capacity model exists. | Add inventory/capacity model before real payment capture for same-day products. |
| Preview mode can hide prod DB misconfig | Blocker | Deployment | Missing DB currently falls back to seed data. Useful for CI/dev, risky for prod. | Require explicit `APP_MODE=preview` or equivalent before seed fallback is allowed. |
| Localization schema decision | High | Catalog/storefront | Copy registry exists, but product/category DB copy is single-locale. | Decide column-per-locale vs translation table before more catalog copy accrues. |
| Service layer missing | Medium | CMS/domain logic | Server actions currently validate/write/audit/revalidate inline. | Extract `lib/cms/services/` before business invariants scatter. |
| Image alias table in route code | Medium | Media | Category image aliases are embedded in route code. | Move aliases into seed data, CMS media fields, or media mapping records. |
| Media source ambiguity | Medium | Media | `Media.url` can represent external/local/generated/future object storage. | Add source/type metadata before object-storage migration. |
| Migration testing absent | Medium | Deployment/DB | CI gates build/type/test, but migration behavior on populated DB is not documented. | Add migration policy and at least staging migration checklist. |
| Audit retention and PII handling | Medium | Admin/security | Audit logs exist, but retention/export/redaction are not documented. | Define retention, export, and PII rules. |

## Accepted architecture direction

### Keep

- Seeded fallback for local preview and CI.
- Recursive `Category.parentId` model.
- Provider seams for SMS and payments.
- Server-action admin write contract with role assertion and audit logging.
- CMS-controlled homepage visibility via `showOnHomepage`.
- Owned/generated image assets instead of copied source-site assets.

### Change next

1. Document and implement checkout state transitions.
2. Design customer auth throttling and abuse prevention.
3. Add explicit preview/prod mode boundary.
4. Decide localization persistence model.
5. Start extracting domain services once invariants appear in admin actions.

## Recommended architecture document order

1. `CHECKOUT_ARCHITECTURE.md` — state machine, cart/order handoff, payment idempotency, fulfillment, inventory/capacity.
2. `CUSTOMER_ACCOUNT_ARCHITECTURE.md` — OTP, throttling, sessions, profile, address book, abuse protection.
3. `DEPLOYMENT_ARCHITECTURE.md` — preview/prod boundary, env contract, migrations, CI, staging/prod launch checklist.
4. `MEDIA_ARCHITECTURE.md` — generated assets, alias migration, local upload, object storage, CDN.
5. `CATALOG_ARCHITECTURE.md` — category/product/media model after localization persistence is decided.

## Launch blocker checklist

Before public production launch:

- [ ] OTP per-phone rate limit.
- [ ] OTP per-IP rate limit.
- [ ] OTP verify-attempt backoff or lockout policy.
- [ ] Checkout order state machine.
- [ ] Payment attempt state machine and webhook idempotency plan.
- [ ] Cart-to-order atomicity rule.
- [ ] Inventory/capacity reservation rule.
- [ ] Explicit preview-vs-production runtime mode.
- [ ] Migration and seed policy for staging/prod.
- [ ] Localization persistence model.

## Review cadence

Update this file whenever a risk changes severity, becomes implemented, or is superseded by a dedicated architecture document.
