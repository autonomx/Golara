# Phase 20.3 — Object storage provider seam

## Goal

Make media storage provider readiness explicit before production launch while preserving the current local and Cloudinary upload behavior.

## Implemented

- Added `MediaStorageReadiness`.
- Extended the media storage provider contract with:
  - `productionSafe`
  - `isConfigured()`
  - `readiness()`
- Added `getMediaStorageReadiness()`.
- Marked local filesystem storage as configured but not production-safe.
- Marked Cloudinary storage as production-safe only when required env vars are present.
- Added media storage readiness to `RuntimeReadiness`.
- Updated the admin readiness panel to use the detailed storage readiness contract.
- Removed the older boolean-only `hasProductionStorage` admin wiring.

## Provider behavior

### Local

`MEDIA_STORAGE_PROVIDER=local` or unset.

- Always configured.
- Not production-safe.
- Stores uploaded images under `public/uploads`.
- Suitable for local development and previews only.

### Cloudinary

`MEDIA_STORAGE_PROVIDER=cloudinary`.

Required env vars:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_UPLOAD_PRESET`

Optional env vars:

- `CLOUDINARY_UPLOAD_FOLDER`

Cloudinary is treated as production-safe only when the required env vars are present.

## Production readiness behavior

The admin readiness panel now renders media storage from the runtime readiness object:

- ready when a production-safe provider is configured;
- warning for local storage outside production;
- blocked for local or incomplete storage in production mode.

This is advisory in the admin panel and does not change upload permissions.

## Compatibility behavior

Existing upload behavior is preserved:

- local uploads still write to `public/uploads`;
- Cloudinary uploads still use the existing unsigned upload-preset flow;
- media records still receive the metadata added in Phase 20.1.

## Follow-up

Future storage providers such as S3 or Supabase Storage can implement the same provider contract.

A later production hardening phase should add deploy-check enforcement so production deploys can fail fast when media storage is not production-safe.
