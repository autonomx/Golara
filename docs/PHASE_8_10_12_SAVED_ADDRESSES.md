# Phase 8.10-8.12 saved address and contact management

This bundle adds the first customer-facing saved address management surface.

## Added behavior

- Adds customer-owned address update, default, and delete repository helpers.
- Adds `/account/addresses` as a dynamic authenticated account page.
- Adds address add, update, make-default, and delete server actions.
- Requires an active customer session for all address mutations.
- Scopes every address mutation by signed-in customer ownership.
- Shows empty, database-unavailable, and status states.
- Revalidates account and address pages after mutations.

## Current scope

This bundle manages saved delivery addresses. It does not yet prefill checkout forms from the authenticated profile, implement real login, or add customer profile editing.

## Follow-up bundles

1. Add account-aware checkout prefill from saved customer profile/address data.
2. Add customer profile/contact editing.
3. Add privacy/security review docs for authenticated order and address access.
4. Add a real phone-first login or provider-backed sign-in flow.
