# Phase 5.16-5.17 category breadcrumb

This bundle wires BreadcrumbList JSON-LD into category pages.

## Added behavior

- Category route imports shared breadcrumb JSON-LD helpers.
- Category pages render `JsonLdScript` with `buildCategoryBreadcrumbJsonLd(category)`.

## Current scope

This only adds machine-readable breadcrumb structured data. It does not add visible breadcrumb UI.

## Deferred

- Product page breadcrumb rendering.
- Visible breadcrumb navigation.
- Breadcrumb styling/accessibility pass.
