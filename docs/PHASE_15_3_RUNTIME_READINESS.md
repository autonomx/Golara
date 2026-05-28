# Phase 15.3 — Admin runtime readiness surface

## Goal

Expose production runtime safety status in `/admin` so preview-vs-production configuration is visible before launch.

## Implemented

- Added `lib/runtime-readiness.ts` as a small server-side runtime status helper.
- Added an admin readiness card for runtime mode and production safety.
- Updated the database readiness card to show only `DATABASE_URL` presence, never the secret value.
- Added a seed fallback policy card so staff can see whether seeded fallback is allowed in the current runtime.
- Added unit coverage for production, preview, and Vercel-derived production readiness states.

## Admin readiness fields

The admin readiness surface now reports:

- `APP_MODE`
- `NODE_ENV`
- `VERCEL_ENV`
- `DATABASE_URL` present: yes/no
- seed fallback allowed: yes/no
- production-safe: yes/no

## Safety behavior

Production is considered safe only when the effective runtime mode is `production` and `DATABASE_URL` is present. Preview, development, and test modes remain safe for seeded fallback usage because they are intentionally non-production modes.

`DATABASE_URL` is redacted to a presence flag. The admin UI must not render the connection string.

## Validation

Run:

```bash
npm run test:unit
npm run typecheck
npm run build
```
