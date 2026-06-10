# Admin homepage occasion form localization progress

Status update for the admin route-boundary/module localization bundle.

## Completed in this slice

- Added guarded admin homepage copy keys for the occasion add form and empty state.
- Expanded `tests/unit/admin-home-copy.test.ts` to verify Persian coverage for the new keys.

## Connector limitation

The intended `app/admin/homepage/page.tsx` replacement to wire the occasion add form through the helper was blocked by the connector safety filter during full-file replacement. The route file is long and dense, so this slice avoids unsafe reconstruction claims.

## Follow-up

Wire these keys into `HomepageCategoryManager` in a local or patch-capable environment, or retry through a smaller safe extraction that avoids full-file replacement of the route file.
