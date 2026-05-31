# Checkout and payment decision record

## Status

Decision required before implementation. The current production path remains inquiry-first.

## Context

Golara currently supports product discovery, customer inquiries, staff inquiry follow-up, admin CMS operations, deploy readiness checks, media storage readiness, and inquiry notification delivery.

The schema already contains early checkout-related groundwork, including cart, order, payment-attempt, payment-event, capacity, address, and customer-auth tables. That groundwork does not mean online payments are production-approved. No new payment provider code should be added until the product direction is explicitly selected.

## Current default: inquiry-first storefront

The inquiry-first path means Golara treats product pages as lead-generation and staff-assisted sales surfaces. Customers submit inquiries, staff review them in admin, follow up, and coordinate fulfillment manually or through future operations tools.

This path fits when:

- Product availability, delivery timing, custom arrangements, or pricing often require staff confirmation.
- The first production launch needs lower operational and compliance risk.
- Staff can reliably monitor the admin inbox and notification channel.
- Payment collection can remain offline, manual, or handled outside Golara for the initial launch.

Recommended next inquiry-first work:

- Strengthen inquiry status workflow and staff assignment.
- Add better inquiry dashboard filters and follow-up exports.
- Add notification provider delivery beyond generic webhook if needed.
- Add admin account management before scaling staff usage.
- Add customer-facing inquiry status updates only after staff workflow is stable.

## Alternative: full checkout storefront

The checkout path means Golara supports cart, order creation, payment provider integration, inventory or capacity reservation, taxes or fees, delivery scheduling, and order lifecycle management.

This path fits when:

- Products have clear prices and fulfillment rules at purchase time.
- Online payment capture is required for the first launch.
- Staff can support payment failures, refunds, cancellations, and order amendments.
- The business is ready to own payment, tax, fraud, reconciliation, and fulfillment edge cases.

Required decisions before checkout implementation:

- Payment provider and settlement currency.
- Whether payment is authorization-only, capture-now, manual confirmation, or invoice link.
- Whether checkout is for all products or only selected products.
- Inventory and capacity reservation rules.
- Delivery zones, delivery windows, fees, and blackout rules.
- Tax and discount handling.
- Refund, cancellation, and failed-payment policy.
- Staff order-management workflow and audit requirements.

## Implementation rule

Do not add payment provider code until the checkout path is explicitly approved.

Before any payment implementation PR, create a follow-up decision record that names the provider, payment mode, operational policy, and minimum launch scope. That PR should stay documentation-only or configuration-only. Payment code should start in a later phase after the decision is merged.

## Recommended Phase 25 sequence

1. Phase 25.1: this decision record, keeping inquiry-first as the current default.
2. Phase 25.2 inquiry-first option: strengthen staff inquiry workflow and reporting.
3. Phase 25.2 checkout option: write a provider and order-lifecycle decision record, still without provider code.
4. Phase 25.3+ checkout option only: implement checkout seams behind service boundaries.

## Current decision

For now, Golara remains inquiry-first. Checkout and online payment implementation are deferred until explicitly selected.
