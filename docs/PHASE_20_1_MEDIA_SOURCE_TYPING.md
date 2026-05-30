# Phase 20.1 — Media source typing

## Goal

Add explicit media source/provider metadata so the CMS can distinguish external URLs, uploaded assets, seed/fallback media, generated images, and future object-storage assets.

## Implemented

- Extended the Prisma `Media` model with migration-safe metadata fields:
  - `sourceType`
  - `storageProvider`
  - `mimeType`
  - `sizeBytes`
  - `metadata`
- Added an index on `sourceType + storageProvider`.
- Extended the shared `MediaItem` view model with optional source metadata.
- Updated admin media URL registration to persist:
  - `sourceType: external`
  - `storageProvider: external`
- Updated admin media uploads to persist:
  - `sourceType: upload`
  - provider from the storage backend, currently `local` or `cloudinary`
  - MIME type
  - byte size
  - original filename in metadata
- Updated seed fallback media projection to mark media as:
  - `sourceType: seed`
  - `storageProvider: seed`
- Updated the admin media library cards to display media source/provider/type/size metadata.

## Source type policy

Initial source type values:

- `external` — URL registered manually from an external source.
- `upload` — file uploaded through the admin media uploader.
- `seed` — seeded/fallback media used when database content is unavailable.
- `generated` — reserved for future generated image workflows.

## Storage provider policy

Initial storage provider values:

- `external`
- `local`
- `cloudinary`
- `seed`

Future providers such as S3 can be introduced without changing the media view model.

## Migration safety

The schema change is additive:

- `sourceType` has a default of `external`.
- provider/type/size/metadata are nullable.
- existing media rows remain valid.

## Follow-up

Phase 20.2 should migrate category image aliases into data-backed media mappings or seed data so route/component code no longer owns those aliases.

Phase 20.3 should formalize the object-storage provider seam and production readiness warnings around local-only storage.
