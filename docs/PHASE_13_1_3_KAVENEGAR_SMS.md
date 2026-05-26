# Phase 13.1-13.3 — Kavenegar SMS provider

This bundle adds the first concrete customer SMS adapter for OTP delivery.

## Goals

- Keep the existing customer message provider seam intact.
- Add one concrete production SMS adapter.
- Preserve local `log`, deployment `disabled`, and generic `webhook` modes.
- Avoid adding a vendor SDK dependency by using Kavenegar's REST API directly.

## Added behavior

- `CUSTOMER_MESSAGE_PROVIDER=kavenegar` routes OTP/customer messages to Kavenegar.
- `KAVENEGAR_API_KEY` configures the Kavenegar API key.
- `KAVENEGAR_SENDER` optionally configures the sender line.
- `KAVENEGAR_BASE_URL` optionally overrides the API base URL for sandbox/proxy testing.
- Kavenegar delivery uses `application/x-www-form-urlencoded` POST data.
- Delivery is considered accepted only when the HTTP response is OK and the provider payload returns status `200`.
- Kavenegar message ID is stored as the delivery reference when returned.

## Environment configuration

```bash
CUSTOMER_MESSAGE_PROVIDER=kavenegar
KAVENEGAR_API_KEY=replace-with-provider-key
KAVENEGAR_SENDER=replace-with-approved-sender
```

Optional:

```bash
KAVENEGAR_BASE_URL=https://api.kavenegar.com
```

## Provider modes after this bundle

- `log` — local/development delivery through server logs.
- `disabled` — blocks OTP challenge creation when delivery is not configured.
- `webhook` — generic webhook adapter for external delivery services.
- `kavenegar` — concrete Kavenegar SMS adapter.

## Manual QA checklist

1. Configure `CUSTOMER_MESSAGE_PROVIDER=kavenegar`.
2. Configure `KAVENEGAR_API_KEY` as a server-only secret.
3. Configure `KAVENEGAR_SENDER` only after the sender line is approved by the provider.
4. Request a customer login code from `/account/login`.
5. Confirm the OTP is received on the requested phone number.
6. Confirm a successful delivery creates a usable OTP challenge.
7. Temporarily remove or invalidate `KAVENEGAR_API_KEY` and confirm OTP challenge creation fails cleanly.
8. Confirm production logs do not print OTP codes in Kavenegar mode.

## Scope note

This bundle does not add IP-level throttling, provider dashboard automation, delivery receipt callbacks, or Playwright login-flow automation. Those remain separate production hardening tasks.
