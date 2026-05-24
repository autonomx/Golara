# Phase 5.13-5.15 breadcrumbs

This bundle adds the shared foundation for BreadcrumbList JSON-LD.

## Added foundation

- `buildBreadcrumbJsonLd()` generic helper.
- `buildCategoryBreadcrumbJsonLd()` category helper.
- `buildProductBreadcrumbJsonLd()` product helper.

## Current scope

The helper foundation is added first. Route-level rendering can be wired in narrow follow-up patches to avoid broad route rewrites.

## Deferred

- Category page BreadcrumbList rendering.
- Product page BreadcrumbList rendering.
- Visible breadcrumb navigation.
- Breadcrumb styling and accessibility pass.
