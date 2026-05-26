# Phase 10.7-10.9 customer profile and contact editing

This bundle adds signed-in customer profile/contact editing.

## Added behavior

- Adds `updateCustomerProfile` repository helper.
- Adds `/account/profile` as a dynamic authenticated profile edit page.
- Adds profile update server action.
- Allows signed-in customers to update:
  - display name
  - email
  - locale
- Leaves verified phone changes intentionally deferred until a separate phone-verification flow exists.
- Revalidates account, profile, and cart checkout pages after profile updates.
- Updates account overview with an edit-profile link.

## Current scope

This is limited to low-risk profile fields. It does not allow direct phone changes because phone is the verified login identity.

## Follow-up bundles

1. Add verified phone-change flow if needed.
2. Add production delivery-provider runbook once the delivery provider is selected.
3. Add manual QA checklist for login, resend/cooldown, profile editing, order history, address management, checkout prefill, and logout.
4. Add automated smoke coverage when the test stack is introduced.
