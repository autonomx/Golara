# Phase 11.10-11.12 — Public storefront Persian copy pass

This bundle finishes the initial Phase 11 localization foundation by moving reusable public storefront UI labels onto a small storefront copy helper.

## Goals

- Centralize reusable public storefront labels without rewriting CMS/catalog content.
- Preserve existing homepage, category, product, cart, and inquiry behavior.
- Keep product/category/homepage marketing content sourced from the CMS catalog repository.
- Leave full locale routing or a larger i18n framework migration deferred until the copy surface requires it.

## Implemented foundation

- Added `lib/localization/storefront-copy.ts`.
- Added English and Persian labels for homepage section headings, product badges, product CTAs, quantity label, product availability text, cart-unavailable note, and breadcrumb home label.
- Migrated homepage collection/favorites section labels to the storefront copy helper.
- Migrated product card badges and add-to-cart button label to the storefront copy helper.
- Migrated product detail quantity, add-to-cart, WhatsApp, availability, pre-order, and cart-unavailable labels to the storefront copy helper.
- Migrated product and category breadcrumb `Home` label to the storefront copy helper.

## Scope note

This bundle intentionally does not translate CMS-managed product names, product descriptions, category names, category descriptions, or homepage hero content. Those values should remain editable content and can be localized later through CMS fields or a dedicated content model.

This bundle also avoids adding route-level locale negotiation or a full i18n framework. The current foundation keeps labels centralized and ready for future locale selection.

## Manual QA checklist

- Homepage still renders hero content from the CMS repository.
- Homepage collection and favorites headings still render.
- Product cards still link to product detail pages.
- Product cards still preserve add-to-cart form field names and server action.
- Product detail add-to-cart form still uses the same field names and action.
- WhatsApp link still includes the selected product title.
- Category and product breadcrumbs still link to the homepage.
- Product/category CMS text remains unchanged.

## Recommended follow-up

- Add locale-aware public routing or customer/browser locale selection if Persian should become the default storefront language.
- Add CMS fields for translated homepage hero, category, and product content when content editors need Persian and English variants.
- Localize query-string status/error messages in a focused pass.
