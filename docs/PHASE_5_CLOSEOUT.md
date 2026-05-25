# Phase 5 closeout

Phase 5 focused on polish and growth foundations after the Phase 4 ecommerce foundation. The work improved discoverability, metadata, structured data, public navigation, image performance hints, keyboard accessibility, customer order accessibility, and the smoke-test planning path.

## Completed foundations

- Site metadata helper and page metadata alignment.
- Product, category, organization, website, and breadcrumb JSON-LD.
- Visible path navigation on product pages.
- Sitemap and robots routes.
- Metadata, accessibility, and performance QA docs.
- Product image loading hints and homepage image priority hints.
- Card accessible labels and card focus states.
- Product checkout and inquiry form focus states.
- Skip-to-content link foundation on public pages.
- Admin skip-link targets on admin-facing page roots.
- Site-wide public button/link focus audit.
- Public order status accessibility polish.
- Admin form focus consistency pass.
- Smoke-test foundation doc and recommended Playwright path.

## Current CI baseline

The repository currently validates pull requests with:

- `npm install`
- `npm run check:file-lines`
- `npm run db:generate`
- `npm run typecheck`
- `npm run build`

## Deferred items

- Full Persian storefront copy beyond the public order status page.
- Real PSP integration for providers such as Zarinpal, Zibal, or IDPay.
- Provider signed callback verification before marking orders paid.
- Full multi-item cart/session flow.
- Customer accounts, login, dashboard, and order history.
- Lighthouse CI.
- Full Playwright suite and browser-install CI job.
- Admin auth provider upgrade with per-user accounts and stronger role management.
- Advanced search and filters.
- Seasonal landing pages.
- Analytics events.

## Recommended next direction

Phase 6 should choose one product track rather than continuing broad polish. The strongest candidates are:

1. Real PSP integration and callback verification.
2. Full cart/session flow.
3. Customer accounts and order history.
4. Persian storefront localization.
5. Playwright/Lighthouse automation hardening.

For production ecommerce readiness, PSP integration plus callback verification is the highest-leverage next track. For storefront market fit, Persian localization is the highest-leverage customer-facing track.
