# Customer account origin boundary

This slice extends the shared same-origin server-action boundary beyond admin login into customer account mutations.

## Covered actions

- Customer OTP request and verification.
- Customer profile updates.
- Customer address add, update, default, and delete actions.

These actions are cookie-backed or account-mutating, so they now run `assertSameOriginServerAction()` before issuing OTPs, creating sessions, or changing customer profile/address state.

The guard remains tolerant of missing framework/internal origin headers, matching the admin login boundary behavior, but rejects cross-origin submissions when the request origin can be inferred.
