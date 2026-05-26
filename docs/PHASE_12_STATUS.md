# Phase 12 status

Phase 12 has started with a lightweight smoke-route foundation.

Current implemented bundle:

- `docs/PHASE_12_1_3_SMOKE_ROUTES.md`
- `tools/smoke-routes.mjs`
- `npm run smoke:routes`

This keeps the first QA bundle small and additive. The broader `docs/ROADMAP.md` Phase 12 section already identifies the smoke-test direction and first-route coverage. A later closeout bundle should fold completed Phase 12 items back into the main roadmap once more smoke-test coverage exists.

Next recommended Phase 12 bundles:

1. Add CI or staging instructions for running `npm run smoke:routes` after `npm run build` and app startup.
2. Add rendered-content assertions for homepage, cart, login, sitemap, and robots.
3. Add Playwright only after route-level smoke coverage is stable.
