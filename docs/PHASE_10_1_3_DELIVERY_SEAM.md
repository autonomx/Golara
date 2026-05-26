# Phase 10.1-10.3 production message delivery seam

This bundle starts Phase 10 by extracting customer sign-in message delivery behind a provider seam.

## Added behavior

- Adds `lib/customers/customer-message-provider.ts`.
- Adds a reusable `sendCustomerMessage` helper.
- Supports `log` delivery for local/development mode.
- Supports `disabled` mode for deployments that need sign-in disabled until a provider is configured.
- Supports webhook-style delivery through `CUSTOMER_MESSAGE_WEBHOOK_URL`.
- Supports optional bearer token configuration with `CUSTOMER_MESSAGE_WEBHOOK_TOKEN`.
- Replaces inline OTP log delivery with the message provider seam.
- Stores delivery provider/reference metadata on OTP challenges.
- Blocks OTP challenge creation when delivery fails.

## Environment knobs

- `CUSTOMER_MESSAGE_PROVIDER=log|disabled|webhook`
- `CUSTOMER_MESSAGE_WEBHOOK_URL`
- `CUSTOMER_MESSAGE_WEBHOOK_TOKEN`

Legacy compatibility:

- `CUSTOMER_OTP_DELIVERY_PROVIDER` is still read as a fallback for provider selection.

## Current scope

This is a provider seam and webhook-style adapter. It is not yet a direct vendor-specific SMS adapter and it does not add provider dashboard runbooks.

## Follow-up bundles

1. Add a concrete provider adapter when the deployment provider is selected.
2. Add account privacy/security review docs.
3. Add customer profile/contact editing.
4. Add manual QA checklist for login and account flows.
