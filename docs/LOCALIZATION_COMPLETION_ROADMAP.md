# Localization completion roadmap

## Current source of truth

- Repo: `autonomx/Golara`
- Branch: `main`
- Current focus: admin route-boundary/module localization after Bundle C dashboard extraction and guard hardening.
- Workflow: keep slices narrow, use focused guards, and avoid connector rewrites of `components/admin/AdminDashboard.tsx` unless a local patch-capable environment can safely reconstruct the full file.

## Completed bundles

### Bundle A — Audit and guardrails

- Added the global localization source audit and fixture allowlist.
- The global allowlist is still intentionally broad for legacy migration surfaces and should be tightened incrementally.

### Bundle B — AdminDashboard extraction/prep

Extracted admin dashboard sections, shared catalog controls, dashboard chrome, CMS status panel, and catalog dashboard helpers so future localization can target smaller files instead of the large `AdminDashboard.tsx` monolith.

### Bundle C — AdminDashboard wiring/localization prep

- Added workspace composition for admin catalog, overview, and content workspaces.
- Added workspace composition and swap guards/scripts.
- Localized and guarded extracted admin dashboard/catalog/content components.
- Pending local-only task: run `npm run codemod:admin-dashboard-workspaces`, `npm run test:admin-dashboard-workspaces`, and `npm run typecheck`, then commit the resulting `components/admin/AdminDashboard.tsx` swap from a local/CLI patch-capable environment.

## Active bundle — Admin route-boundary/module localization

Completed route-boundary slices:

- Guarded admin route error shell copy keys.
- Guarded admin module route error copy.
- Guarded admin console tab copy keys.
- Guarded admin console module header copy.
- Guarded admin page shell copy keys.
- Guarded admin route error copy parity.
- Guarded `components/admin/AdminRouteError.tsx` source localization wiring.
- Fixed `components/admin/AdminPageShell.tsx` count badges to use dictionary-backed lowercase count keys for product, category, and media labels.
- Expanded `tests/unit/admin-page-shell-copy.test.ts` to guard product/category/media count copy keys.
- Guarded `components/admin/AdminRouteLoading.tsx` source localization wiring and route loading copy keys.
- Guarded admin `loading.tsx` route shells so their title and eyebrow props stay backed by Persian loading-copy keys.
- Localized `app/admin/products/page.tsx` pagination copy through `lib/localization/admin-catalog-page-copy.ts` and added a focused source/key guard.
- Guarded `app/admin/readiness/page.tsx` as a localization-clean route wrapper that delegates to the admin console readiness section.
- Guarded `app/admin/payments/alerts/page.tsx` route-boundary localization wiring through `createAdminTranslator(locale)` and admin dictionary-backed copy keys.

CI note from PR #510:

- GitHub Actions `CI` run `27297116047` failed in `Unit tests`.
- `Typecheck` passed.
- Failure was in `tests/unit/admin-page-shell-copy.test.ts`, which expected lowercase count copy keys while `AdminPageShell.tsx` used capitalized fallback-prone keys.
- The follow-up patch keeps the component and guard aligned on dictionary-backed lowercase count keys.

CI notes from follow-up route-boundary slices:

- PR #511 passed GitHub Actions before merge, including typecheck, unit, functional, API, nonbrowser, E2E contract suites, build, and route smoke.
- PR #512 passed GitHub Actions before merge, including typecheck, unit, functional, API, nonbrowser, E2E contract suites, build, and route smoke.
- PR #513 passed GitHub Actions before merge, including typecheck, unit, functional, API, nonbrowser, E2E contract suites, coverage, build, and route smoke.
- The squash merge commits for these route-boundary slices may not receive separate pull-request workflow runs; use the PR head runs as CI evidence when no merge-commit run is attached.

## Next recommended Phase 1 slices

1. Continue narrowing admin route-boundary coverage with one route shell/component per PR.
2. Search `app/admin/**/page.tsx`, `app/admin/**/error.tsx`, and `app/admin/**/loading.tsx` for direct visible copy, placeholders, titles, aria labels, and fallback-prone `t(...)` keys.
3. Add source/key guards for route-shell files that are already localization-clean.
4. Start replacing the broad `app/**` allowlist with explicit route-shell exceptions only after the protected route shell tests pass.

## Phase 1 definition of done

- Admin route error shells are guarded.
- Admin route loading shells are guarded.
- Admin page shell and console shell are guarded.
- Admin module pages are either source-guarded/localized or still explicitly allowlisted by path with a reason.
- The broad `app/**` allowlist is narrowed to explicit remaining files.

## Remaining roadmap

### Phase 2 — Complete admin component localization

- Remove or drastically narrow `components/admin/**` from the global localization audit allowlist.
- Add source/key guards component-by-component for remaining admin panels, forms, and tables.

### Phase 3 — Storefront localization completion

- Guard/localize storefront components and route shells.
- Remove or narrow `components/storefront/**` and storefront route allowlists.

### Phase 4 — Dynamic/server copy localization

- Localize server/action messages, payment/settlement labels, seed/demo content, and notification/email templates where user-visible.

### Phase 5 — RTL/rendered no-English gate

- Add rendered or equivalent static guards for Persian RTL direction and no raw English in protected surfaces.

### Phase 6 — Remove broad allowlists and final audit

- Replace broad allowlists with explicit path-specific exceptions.
- Keep each exception documented with a reason and removal target.
