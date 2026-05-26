# Phase 12.10-12.12 — CI smoke route wiring

This bundle wires the existing route smoke runner into the GitHub Actions CI workflow.

## Goals

- Run route smoke checks automatically after the app builds.
- Keep the workflow dependency-free and aligned with the existing Node-based smoke scripts.
- Catch blank pages, broken route responses, sitemap/robots regressions, and signed-out private-route regressions before merge.

## Implemented foundation

- `.github/workflows/ci.yml` now runs `npm run smoke:routes:local` after `npm run build`.
- The local runner starts the built app with `npm run start`.
- The route checker validates HTTP statuses and configured response-body snippets.
- The runner stops the started app process after the checks finish.

## CI order

The CI job now runs:

1. `npm install`
2. `npm run check:file-lines`
3. `npm run db:generate`
4. `npm run typecheck`
5. `npm run build`
6. `npm run smoke:routes:local`

## Scope note

This is still not a browser automation suite. It is a route-level smoke gate intended to catch major launch regressions while keeping Phase 12 incremental.

Playwright and full interaction coverage remain deferred.

## Manual QA checklist

- Confirm PR CI runs `npm run smoke:routes:local` after `npm run build`.
- Confirm failing route smoke checks fail the CI job.
- Confirm the runner does not require a configured production database.
- Confirm signed-out `/account/orders` remains redirect/status-gated rather than content-gated.
