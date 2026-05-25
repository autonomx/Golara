# Phase 5.23-5.25 site index

This bundle adds basic crawlability metadata routes.

## Added behavior

- `app/sitemap.ts` generates a sitemap from active storefront content.
- Sitemap includes:
  - homepage
  - category pages
  - product pages
- `app/robots.ts` allows public pages and excludes admin/API paths.
- Robots metadata links to `/sitemap.xml`.

## Environment

`NEXT_PUBLIC_SITE_URL` should be set in production so sitemap and robots output use the real domain.

## Deferred

- Locale-aware alternate links.
- Image sitemap entries.
- More precise `lastModified` values from database timestamps.
- Admin-configurable noindex rules.
