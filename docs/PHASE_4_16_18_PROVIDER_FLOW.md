# Phase 4.16-4.18 provider flow

This bundle adds a configurable provider-flow foundation.

## Added foundation

- Provider selection now supports `manual` and `domestic_redirect`.
- `domestic_redirect` builds an external handoff URL from configuration.
- Missing configuration safely falls back to manual staff follow-up.
- Attempts can store a redirect URL and provider reference.
- Return URL construction can use `NEXT_PUBLIC_SITE_URL` and the public order lookup token.

## Environment values

```bash
NEXT_PUBLIC_SITE_URL="https://example.com"
CHECKOUT_DOMESTIC_GATEWAY_PROVIDER="domestic_redirect"
CHECKOUT_DOMESTIC_GATEWAY_START_URL="https://provider.example/start"
```

## Deferred

- Provider-specific request and verify implementations.
- Callback route hardening.
- Paid and failed lifecycle transitions from provider responses.
