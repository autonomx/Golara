# Phase 8.13-8.15 account-aware checkout prefill

This bundle connects the customer account/session foundation to cart checkout presentation.

## Added behavior

- Reads the active customer session cookie on `/cart/checkout`.
- Prefills recipient name, phone, and email from the signed-in customer profile.
- Prefills delivery address fields from the default saved address when available.
- Falls back to the most recent saved address when no default exists.
- Shows a customer-facing status note when checkout has been prefilled from the account.
- Adds a manage-addresses link from checkout for signed-in customers.

## Current scope

This is presentation-only checkout prefill. The final checkout action still validates submitted form data and creates order/customer/address records through the existing server-side path.

## Follow-up bundles

1. Add customer profile/contact editing.
2. Add privacy/security review docs for authenticated order and address access.
3. Add real phone-first login or provider-backed sign-in flow.
4. Add field-level checkout validation polish and localization.
