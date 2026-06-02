# Admin Saleor Parity Roadmap

This roadmap tracks the path from the current Golara admin console toward a Saleor-like commerce operations dashboard. The goal is not to copy Saleor wholesale, but to add the admin capabilities Golara needs in a sequence that protects the existing flower-shop workflows.

## Current Baseline

Golara admin currently supports:

- overview/readiness/security panels;
- product, category, and media management;
- homepage copy and translations;
- customer inquiries and assignment workflows;
- checkout order list/detail, fulfillment status, packing slips, CSV/print tools;
- media upload/URL registration with image-category tagging;
- staff/readiness visibility for owner accounts.

The biggest gaps versus Saleor are product variants/PIM depth, inventory, customer admin, promotions, settings, and richer order operations.

## Phase 1: Admin Navigation And List UX

Goal: make the admin shell feel like a durable operations console before adding deeper data models.

- [x] Keep Products, Categories, and Media as separate pages.
- [x] Add separate sidebar entries/pages for Orders and Inquiries.
- [ ] Add separate sidebar entries for Customers, Discounts, Settings.
- Add consistent page headers, breadcrumbs, and primary actions.
- Add pagination to product/category/media tables.
- Add column visibility controls for dense tables.
- Add saved filters or at least query-string-preserved filters.
- Add empty/loading/error states per module.
- Add row-level actions without secondary edit rows.

Success criteria:

- Admin pages remain usable with hundreds of products/media items.
- Sidebar stays fixed while wide tables scroll.
- Each major entity has a predictable list/detail/create pattern.

## Phase 2: Product Information Management

Goal: move from simple product records toward Saleor-style catalog modeling.

- Add product detail pages instead of large inline edit forms.
- Add product variants/SKUs.
- Add variant price, SKU/code, active state, and image fields.
- Add product types.
- Add reusable product attributes.
- Add product and variant attribute values.
- Add product SEO fields: title, description, canonical path, index controls.
- Add collection support separate from categories.
- Add bulk product import/export.
- Add spreadsheet-friendly bulk editing for common fields.

Success criteria:

- A product can have multiple purchasable variants.
- Merchandising fields are structured rather than hardcoded per product.
- Admin can edit large catalogs without opening every product inline.

## Phase 3: Inventory And Fulfillment

Goal: add operational stock and fulfillment foundations.

- Add inventory quantities per product variant.
- Add stock tracking toggle for made-to-order or quote-only items.
- Add low-stock threshold.
- Add stock adjustment audit log.
- Add warehouse/location model.
- Add multi-location stock.
- Add fulfillment method settings: delivery, pickup, courier/manual.
- Connect inventory reservation to checkout/order lifecycle.
- Add fulfillment cards on order detail pages.

Success criteria:

- Staff can see whether an item can be sold today.
- Inventory changes are auditable.
- Orders can reserve/release stock or capacity consistently.

## Phase 4: Customer Admin

Goal: make customer support possible from the admin panel.

- Add customer list page.
- Add customer detail page.
- Show customer profile, phone/email, locale, account providers.
- Show customer order history.
- Show inquiry history.
- Show saved addresses.
- Allow staff to update safe profile fields.
- Add admin notes or customer timeline.
- Add privacy/safety controls for sensitive fields.

Success criteria:

- Staff can answer customer questions without leaving the admin console.
- Customer data access is role-aware and auditable.

## Phase 5: Orders And Payments Parity

Goal: improve order operations beyond list/status management.

- Add draft orders created by staff.
- Add editable order line items before confirmation.
- Add customer/address assignment to draft orders.
- Add manual payment marking.
- Add payment attempt timeline and provider references.
- Add refunds/voids when supported by provider.
- Add order discounts.
- Add fulfillment shipment/delivery records.
- Add order activity timeline with staff attribution.
- Add email/SMS notification actions with retry state.

Success criteria:

- Staff can create and manage an order end to end.
- Payment and fulfillment states are visible and auditable.

## Phase 6: Promotions, Discounts, And Gift Cards

Goal: support merchandising campaigns without code changes.

- Add discount model: percentage/fixed amount.
- Add voucher/coupon codes.
- Add validity windows.
- Add usage limits.
- Add product/category/customer eligibility.
- Add order minimums.
- Add gift card or store-credit foundation if needed.
- Add promotion audit logs.

Success criteria:

- Owner can run basic campaigns from admin.
- Discounts apply predictably at cart/checkout and are visible on orders.

## Phase 7: Channels, Localization, And Pricing

Goal: add controlled multi-market behavior where Golara needs it.

- Add channel/storefront model if business needs multiple storefront contexts.
- Add channel currency and locale defaults.
- Add channel-specific product availability.
- Add channel-specific price overrides.
- Add localized SEO metadata.
- Add translation completeness dashboard per entity.
- Add locale-aware media alt text.

Success criteria:

- Persian/English and future market differences can be managed without code edits.
- Staff can see which content is incomplete before launch.

## Phase 8: Settings And Configuration

Goal: centralize store configuration currently spread across env/code.

- Add store settings page.
- Add storefront navigation/menu builder.
- Add homepage banner/media settings.
- Add shipping/delivery settings.
- Add tax category settings.
- Add payment provider settings/readiness.
- Add notification provider settings/readiness.
- Add staff accounts and permission groups.
- Add role-based access controls for each admin module.

Success criteria:

- Operational configuration lives in admin where safe.
- Sensitive settings remain protected by role and environment policy.

## Phase 9: Extensibility And Integrations

Goal: prepare for external services and future custom admin modules.

- Add webhook configuration.
- Add event log for outgoing webhooks.
- Add integration/app registry.
- Add API token management if needed.
- Add provider diagnostics pages.
- Add dashboard extension mount points for internal tools.
- Add import/export job tracking.

Success criteria:

- Integrations can be managed and observed without ad hoc code changes.
- Failed external calls are visible and retryable.

## Phase 10: Analytics And Operations Home

Goal: make the overview page useful for daily commerce operations, not only readiness.

- Add order count and revenue summaries.
- Add inquiry conversion summary.
- Add best-selling products.
- Add low-stock alerts.
- Add fulfillment queue summary.
- Add recent activity timeline.
- Add failed payment/notification alerts.
- Add launch/readiness health cards.

Success criteria:

- Staff can start the day from the overview page and know what needs attention.
- Owners can see operational trends without querying the database.

## Suggested Build Order

1. Admin navigation and list UX.
2. Product detail pages and variants.
3. Inventory basics.
4. Customer admin.
5. Draft orders and order detail parity.
6. Discounts/vouchers.
7. Settings and permissions.
8. Channel/localization depth.
9. Integrations.
10. Analytics home.

This order prioritizes the parts that compound: better navigation and detail pages make every later module easier to build, and variants/inventory/order detail unlock most serious commerce workflows.

## Open Decisions

- Whether Golara needs full Saleor-style channels or only locale/currency settings.
- Whether products should always have variants, even if there is only one default variant.
- Whether inventory should track floral components, finished products, or both.
- Whether discounts should apply to quote-only/custom-order flows.
- Which provider integrations should be configurable by admin versus environment variables.
- Which modules staff can edit versus owner-only controls.
