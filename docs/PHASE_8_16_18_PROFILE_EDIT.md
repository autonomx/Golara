# Phase 8.16-8.18 customer profile/contact editing

This bundle adds the first customer-facing account profile editing surface.

## Added behavior

- Adds customer profile update repository helper.
- Adds account profile update server action.
- Adds editable display name, email, and locale fields to `/account`.
- Keeps phone read-only for now because phone is the current customer identity key.
- Revalidates `/account` and `/cart/checkout` after profile updates so checkout prefill reflects the new values.
- Adds account status messages for profile update success/failure.
- Adds a direct account link to saved-address management.

## Current scope

This is profile/contact editing only. It does not add phone-number changes, login, identity verification, or account deletion.

## Follow-up bundles

1. Add privacy/security review docs for authenticated order and address access.
2. Add real phone-first login or provider-backed sign-in flow.
3. Add field-level validation polish and localization.
4. Add account deletion/export policy if needed.
