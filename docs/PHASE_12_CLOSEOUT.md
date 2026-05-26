# Phase 12 closeout

Phase 12 added a lightweight production-launch QA foundation without introducing a full browser automation stack.

## Completed foundations

- Route smoke checker script: `tools/smoke-routes.mjs`.
- Local started-app smoke runner: `tools/run-smoke-routes-local.mjs`.
- `npm run smoke:routes` for checking an already-running app.
- `npm run smoke:routes:local` for starting the built app and running smoke checks locally.
- Response status checks for public and account-critical routes.
- Response-body smoke assertions for stable public routes.
- Signed-out `/account/orders` redirect/status guard.
- GitHub Actions CI gate that runs route smoke checks after `npm run build`.

## CI baseline after Phase 12

The CI workflow now runs:

1. `npm install`
2. `npm run check:file-lines`
3. `npm run db:generate`
4. `npm run typecheck`
5. `npm run build`
6. `npm run smoke:routes:local`

## Routes covered by the smoke checker

- `/`
- `/products`
- `/cart`
- `/account/login`
- `/sitemap.xml`
- `/robots.txt`
- `/account/orders`

The private account-orders route intentionally remains status/redirect-oriented so signed-out users do not need access to private content for the smoke check to pass.

## Production limitations

Phase 12 is a smoke-test foundation, not complete end-to-end QA.

Still deferred:

- Playwright or equivalent browser automation.
- Form interaction coverage for cart updates, checkout, login, and profile editing.
- Payment provider sandbox callback coverage.
- RTL visual regression checks.
- Lighthouse CI.
- Seeded staging data fixtures.
- Concrete production SMS provider smoke tests.

## Manual launch checklist

Before a production launch:

1. Run `npm run build`.
2. Run `npm run smoke:routes:local` locally or against staging.
3. Confirm CI passes on the release branch.
4. Manually test product browsing, add-to-cart, cart updates, checkout, account login, logout, order history, saved addresses, and profile editing.
5. Manually verify the selected payment provider sandbox flow and callback handling.
6. Manually verify OTP delivery in the production-like message-delivery mode.
7. Manually inspect Persian/RTL account, cart, checkout, and product surfaces.

## Recommended Phase 13 direction

Phase 13 should build on this smoke foundation with a small browser automation track.

Recommended first Phase 13 bundle:

- Add Playwright or equivalent only if the added dependency is acceptable.
- Cover homepage render, product listing render, cart render, account login render, sitemap, robots, and signed-out account/orders redirect.
- Keep tests read-only at first.
- Defer checkout mutation/payment tests until stable seeded fixtures exist.

Alternative Phase 13 if browser automation should wait:

- Add staging deployment QA documentation.
- Add production launch runbook.
- Add seeded fixture planning for cart/checkout/account tests.
