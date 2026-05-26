# Phase 8.4-8.6 customer session cookie and account route shell

This bundle adds the first customer account route shell on top of the Phase 8 account/session repository foundation.

## Added behavior

- Adds HTTP-only customer session cookie helpers using the `golara_customer_session` cookie.
- Aligns customer session cookie max age with `CUSTOMER_SESSION_TTL_DAYS`.
- Adds a logout server action that revokes the active session and clears the cookie.
- Adds `/account` as a dynamic public account shell.
- Shows signed-in customer profile details when an active customer session cookie exists.
- Shows saved address summaries from the authenticated customer profile.
- Shows a sign-in foundation placeholder when no customer session exists.
- Handles database-unavailable state.

## Current scope

This is still not a real login implementation. It provides the cookie/session route shell and signed-in rendering path so the next bundle can add a phone-first login or provider-backed sign-in flow.

## Follow-up bundles

1. Add phone-first login/request flow or choose a production auth provider.
2. Add authenticated customer order-history page.
3. Add saved address/contact management.
4. Add account-aware checkout prefill.
