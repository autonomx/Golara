# Phase 5.71-5.73 smoke test foundation

This bundle documents the first e2e smoke-test plan and defers automation until Playwright can be introduced deliberately.

## Current CI baseline

The repository currently runs:

- `npm install`
- `npm run check:file-lines`
- `npm run db:generate`
- `npm run typecheck`
- `npm run build`

There is not yet a Playwright dependency, Playwright config, browser install step, or e2e script in `package.json`.

## Proposed first smoke suite

When Playwright is added, keep the initial suite narrow and seeded-fallback friendly:

1. Homepage loads and exposes `main-content`.
2. A seeded product page loads and exposes product detail, checkout draft, and inquiry sections.
3. A seeded category page loads and exposes category content plus product cards.
4. `/sitemap.xml` responds with a sitemap XML response.
5. `/robots.txt` responds with crawler rules and sitemap reference.
6. A fake public order token returns the expected not-found/privacy-safe response.

## Recommended implementation path

- Add `@playwright/test` as a dev dependency.
- Add `playwright.config.ts` using `next build` plus `next start` through `webServer`.
- Add `npm run test:e2e`.
- Add `npx playwright install --with-deps chromium` to CI before the e2e job.
- Start with Chromium only to keep CI cost low.
- Keep tests read-only and compatible with seeded fallback mode.

## Deferred

- Browser automation in this PR, to avoid dependency and lockfile churn during the accessibility polish sequence.
- Checkout/order creation e2e coverage until stable test data and database setup are defined.
- Lighthouse CI.
- Full accessibility scans.
