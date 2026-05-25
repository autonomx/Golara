# Phase 5.26-5.28 index dates

This bundle improves sitemap `lastModified` values while preserving seeded fallback mode.

## Added behavior

- New `lib/cms/site-index-repository.ts` for sitemap-specific reads.
- Category sitemap entries use database `updatedAt` when available.
- Product sitemap entries use database `updatedAt` when available.
- Seeded fallback mode still works when `DATABASE_URL` is not configured.
- Database read failures still fall back to seeded catalog entries.

## Why

The public catalog repository maps UI-facing catalog objects. Sitemap generation benefits from a smaller read model that can include index-specific metadata without expanding all storefront types.

## Deferred

- Image sitemap entries.
- Locale-aware sitemap alternates.
- More precise homepage last-modified tracking from CMS content.
- Admin-configurable noindex rules.
