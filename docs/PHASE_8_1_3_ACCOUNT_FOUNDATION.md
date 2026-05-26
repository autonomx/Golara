# Phase 8.1-8.3 customer account foundation

This bundle starts Phase 8 with a provider-agnostic customer account and session foundation.

## Added behavior

- Adds `CustomerAccount` and `CustomerSession` Prisma models.
- Links customer accounts to the existing phone-first `CustomerProfile` model.
- Supports provider/provider-account identity pairs without choosing a final auth vendor yet.
- Stores customer session tokens as SHA-256 hashes rather than raw tokens.
- Adds session expiry, revocation, provider, user-agent, and optional IP hash fields.
- Adds repository helpers for:
  - linking/upserting customer accounts
  - creating customer sessions
  - reading active customer sessions
  - revoking sessions
  - expiring old sessions
  - listing customer orders

## Current scope

This is a data/repository foundation only. It does not expose public login pages, cookies, account dashboards, or checkout prefill yet.

## Follow-up bundles

1. Add customer session cookie helpers and account route shell.
2. Add phone-first login/request flow or choose an auth provider.
3. Add customer order-history page backed by authenticated customer ownership.
4. Add saved address/contact management.
5. Add account-aware checkout prefill.
6. Add privacy/security review docs for authenticated order access.
