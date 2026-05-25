# Phase 5.18-5.19 product breadcrumb

This bundle wires BreadcrumbList JSON-LD into product pages.

## Added behavior

- Product route imports `buildProductBreadcrumbJsonLd()`.
- Product pages render a product BreadcrumbList JSON-LD script.
- Existing Product JSON-LD remains unchanged.
- Existing checkout and inquiry behavior remains unchanged.

## Current scope

This only adds machine-readable breadcrumb structured data. It does not add visible breadcrumb UI.

## Deferred

- Visible breadcrumb navigation.
- Breadcrumb styling/accessibility pass.
- Locale-specific breadcrumb labels.
