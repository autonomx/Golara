# Phase 12.7-12.9 — Smoke route content assertions

This bundle strengthens the route smoke checker with small response-body assertions for stable public routes.

## Goals

- Keep the smoke test lightweight and dependency-free.
- Check more than HTTP status for key public routes.
- Avoid browser automation until the route-level smoke foundation is stable.
- Preserve redirect-only behavior for private account routes.

## Implemented foundation

- `tools/smoke-routes.mjs` now supports `expectedContent` per route.
- The smoke checker validates content case-insensitively.
- Failure output reports missing content snippets.
- Existing status checks remain intact.

## Current assertions

- `/` should include `Golara`.
- `/products` should include `All products`.
- `/cart` should include `cart`.
- `/account/login` should include `phone`.
- `/sitemap.xml` should include `<urlset`.
- `/robots.txt` should include `User-agent`.
- `/account/orders` remains status/redirect-only because signed-out users should not see private order history.

## Scope note

These are intentionally coarse smoke assertions. They are meant to detect blank pages, wrong route output, and missing generated routes, not replace Playwright or unit tests.

Future bundles can add browser-rendered assertions once Playwright is introduced.

## Manual QA checklist

1. Build and start the app.
2. Run `npm run smoke:routes` against the running app.
3. Confirm failures report both HTTP status and missing content, when applicable.
4. Confirm `/account/orders` still accepts redirect statuses without content assertions.
