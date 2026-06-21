# Admin UX Roadmap

This roadmap tracks the next admin-panel UX pass after the Saleor-parity foundation is in place. The goal is to make Golara admin task-first instead of page-first: staff should immediately see what needs attention, act from compact workflows, and move between products, orders, inquiries, customers, and analytics with fewer clicks.

## Operating principles

- Keep each slice narrow, auditable, and reversible.
- Reuse existing admin data before adding new persistence.
- Prefer pure helpers, adapters, source guards, and unit coverage for reusable logic.
- Keep current list/detail pages intact while adding drawers, cards, and shortcuts on top.
- Make every dashboard card actionable with a clear next step.
- Preserve role-aware access, audit visibility, localization, and accessibility.
- Avoid large UI rewrites unless a phase explicitly calls for a layout replacement.

## Phase 11: Today command center

Goal: make `/admin` answer “what needs attention right now?” before staff choose a module.

Scope:

- Add a top-level Today section to the admin overview.
- Surface action cards for:
  - new inquiries;
  - orders needing fulfillment;
  - payment or notification alerts;
  - products missing images;
  - inactive products;
  - quote-only products that need review;
  - low-stock or inventory-pressure products;
  - checkout/readiness blockers.
- Give every card a direct CTA such as Review products, Open orders, Fix payment, or Contact customer.
- Add empty states for “all clear” conditions.
- Start with derived/read-only cards from data the overview already loads.

Implementation notes:

- Add a pure `buildAdminTodayCards` helper that normalizes severity, label, count, href, and CTA text.
- Add unit coverage for card generation and empty states.
- Keep the first UI pass compact; do not introduce persistence for dismissals yet.

Success criteria:

- Staff can identify the most urgent admin work from the first screen.
- Every Today item deep-links to the right admin module or filtered view.
- The overview remains useful when there are zero urgent issues.

## Phase 12: Overview action dashboard

Goal: turn existing overview panels from passive status into action queues.

Scope:

- Convert key overview metrics into action-oriented summaries.
- Add next-action copy to cards, for example:
  - “3 products need images”;
  - “2 paid orders need fulfillment”;
  - “1 payment requires review”;
  - “5 inquiries are waiting on first response.”
- Add severity and urgency ordering so the highest-risk items appear first.
- Preserve existing readiness, security, analytics, and summary panels.

Implementation notes:

- Build on the Phase 11 Today helper rather than creating a second action-card model.
- Use URL query parameters to link cards into filtered admin views where available.

Success criteria:

- Staff know both current health and next action from the overview.
- The overview is not just a metrics page; it becomes the daily operations entry point.

## Phase 13: Product workflow polish

Goal: make routine catalog edits faster without abandoning the existing product detail pages.

Scope:

- Add a right-side product edit drawer from the product table.
- Show a compact product preview with image, title, code/SKU, price, status, and storefront link.
- Support routine fields in the drawer:
  - title/code/slug;
  - price/currency;
  - category/type;
  - primary image;
  - active, best-seller, available-today, and quote-only flags.
- Add prominent fix-it filters/chips:
  - Missing image;
  - Inactive;
  - Quote only;
  - Price missing;
  - Available today;
  - Best sellers;
  - No category;
  - No Persian translation.
- Preserve full product detail pages for advanced editing.

Implementation notes:

- Keep the drawer as a progressive enhancement over the current table.
- Reuse existing product actions and validation paths.
- Add source/unit guards for filter definitions and drawer field coverage.

Success criteria:

- Common product cleanup can be done from the product list.
- Catalog operators can find broken/incomplete products quickly.
- Advanced editing remains available through the detail page.

## Phase 14: Orders operations queue

Goal: make order handling feel like a queue of next actions instead of a dense table.

Scope:

- Add queue tabs for New, Paid, Preparing, Ready, Delivered, and Needs review.
- Compact order rows by default.
- Move status and fulfillment updates into an expanded row or side drawer.
- Show a clear next action per order, such as “Needs fulfillment,” “Call customer,” or “Ready for delivery.”
- Preserve CSV export, print view, draft order creation, search, pagination, and existing filters.
- Add bulk fulfillment actions where safe.

Implementation notes:

- Start with derived queue tabs backed by existing order/payment/fulfillment state.
- Avoid changing order state machines in the first UX slice.

Success criteria:

- Staff can process orders by queue state.
- The default order table is easier to scan.
- Order update controls are still available but no longer visually dominate each row.

## Phase 15: Inquiry CRM pipeline

Goal: make inquiries feel like a lightweight CRM/support workflow.

Scope:

- Add a pipeline view with statuses:
  - New;
  - Contacted;
  - Waiting on customer;
  - Confirmed;
  - Fulfilled;
  - Cancelled.
- Show inquiry cards with:
  - customer name;
  - phone, WhatsApp, and email actions where available;
  - requested product or occasion;
  - delivery/event date;
  - assigned staff;
  - last follow-up;
  - next recommended action.
- Add shortcuts from inquiry to draft order where data is sufficient.
- Preserve existing search, assignment filters, and status filters.

Implementation notes:

- Begin with a read-only board derived from current inquiry records.
- Add mutation controls only after the board layout is stable.

Success criteria:

- Staff can work inquiries by stage.
- Customer contact actions are one click away.
- Inquiry-to-order conversion becomes easier to start.

## Phase 16: Customer timeline polish

Goal: connect customer support, orders, inquiries, addresses, and notes in one place.

Scope:

- Improve customer detail with a timeline-first layout.
- Surface:
  - order history;
  - inquiry history;
  - saved addresses;
  - admin notes;
  - preferred language;
  - lifetime value;
  - last contacted;
  - privacy/safety metadata.
- Add an action to create a draft order for the customer.

Implementation notes:

- Use role-aware field visibility for sensitive data.
- Keep audit behavior intact for notes and profile edits.

Success criteria:

- Staff can answer customer questions without switching modules.
- Customer history is readable as a timeline, not only as separate tables.

## Phase 17: Actionable analytics insights

Goal: help staff understand what to do with analytics, not just inspect charts.

Scope:

- Add an Insights block near the top of `/admin/analytics`.
- Surface insights such as:
  - best-selling product this week;
  - revenue trend up/down;
  - products with views but no orders;
  - most abandoned funnel step;
  - categories with weak conversion;
  - payment or inquiry friction.
- Link each insight to the relevant section, product list, order list, or inquiry queue.
- Keep the existing sticky analytics quick links and interactive charts.

Implementation notes:

- Prefer derived insights from existing analytics data.
- Add pure insight ranking/formatting helpers with unit coverage.

Success criteria:

- Staff can identify the most important analytics takeaway without reading every chart.
- Insights are explainable and link to follow-up action.

## Phase 18: Global admin search and command palette

Goal: make navigation and common admin actions fast from anywhere.

Scope:

- Add a global admin search/command entry in the shell header.
- Support searching or jumping to:
  - products;
  - orders;
  - customers;
  - inquiries;
  - media;
  - settings/readiness pages.
- Add command shortcuts for:
  - create product;
  - create draft order;
  - upload image;
  - open readiness;
  - open analytics.
- Add keyboard access and accessible labeling.

Implementation notes:

- Start with client-side command definitions and server-backed search routes only where needed.
- Keep permissions/role filtering in the command results.

Success criteria:

- Staff can jump to common destinations without using the sidebar.
- Search results never expose modules the current role cannot access.

## Phase 19: Mobile admin card layouts

Goal: make admin usable on mobile for urgent operations.

Scope:

- Add card layouts for mobile views where tables are currently too wide:
  - products;
  - orders;
  - inquiries;
  - customers;
  - media.
- Add sticky primary actions on mobile where appropriate.
- Keep desktop tables for power users.
- Prioritize scanability and touch targets over table parity.

Implementation notes:

- Implement one module at a time.
- Prefer responsive component variants over separate mobile-only pages.

Success criteria:

- Staff can triage urgent admin work on a phone.
- Mobile views do not require horizontal scrolling for core actions.

## Recommended delivery order

1. Phase 11 — Today command center.
2. Phase 12 — Overview action dashboard.
3. Phase 13 — Product workflow polish.
4. Phase 14 — Orders operations queue.
5. Phase 15 — Inquiry CRM pipeline.
6. Phase 17 — Actionable analytics insights.
7. Phase 16 — Customer timeline polish.
8. Phase 18 — Global admin search and command palette.
9. Phase 19 — Mobile admin card layouts.

The first implementation slice should be Phase 11 because it creates the shared action-card vocabulary that later phases can reuse across Overview, Products, Orders, Inquiries, Readiness, and Analytics.
