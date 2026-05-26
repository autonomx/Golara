# Phase 12.1-12.3 — Smoke route foundation

This bundle starts Phase 12 with a lightweight route smoke-test script that can run against a built and started Golara app.

## Goals

- Add a dependency-free smoke-test foundation before larger launch QA work.
- Cover public and account-critical routes first.
- Keep the script usable locally, in staging, and in future CI jobs.
- Avoid introducing Playwright or a larger browser automation framework in this first bundle.

## Added foundation

- `tools/smoke-routes.mjs`
- `npm run smoke:routes`

The script checks:

- `/` homepage
- `/products` product listing
- `/cart` cart page
- `/account/login` customer login page
- `/sitemap.xml`
- `/robots.txt`
- `/account/orders` unauthenticated account-order route

The account-orders check allows redirect statuses because unauthenticated users should not access private order history directly.

## Usage

Build and start the app, then run:

```bash
npm run smoke:routes
```

By default, the script checks `http://127.0.0.1:3000`.

Override the target base URL with:

```bash
SMOKE_BASE_URL=https://example.com npm run smoke:routes
```

Override the per-route timeout with:

```bash
SMOKE_TIMEOUT_MS=15000 npm run smoke:routes
```

## Scope note

This is not a full browser test suite. It validates route availability and key unauthenticated redirect behavior only. A later Phase 12 bundle can add Playwright coverage for rendered content, forms, cart interactions, login flows, and payment handoff paths.

## Manual QA checklist

1. Run `npm run build`.
2. Start the app with `npm run start` or a staging deployment URL.
3. Run `npm run smoke:routes`.
4. Confirm all configured routes report `PASS`.
5. Confirm `/account/orders` does not return an authenticated private page to signed-out users.
