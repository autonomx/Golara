# Phase 35 — Admin Read Query Helper

This note records the pure query-spec helper added after the admin read-model DTO helpers.

## Implemented helper

`lib/settings/outbound-webhook-admin-read-query.ts` converts already-normalized admin read inputs into a plain query specification for a future read adapter.

The helper returns:

- safe field selection
- normalized filter object
- normalized sort object
- page-size-plus-one fetch count
- optional cursor value
- rejected-input summary
- audit labels

## Safety boundary

The helper is pure and does not import Prisma. It does not read from a database, define a route, render UI, mutate delivery records, send outbound requests, compute signatures, run retries, or create recovery controls.

The safe field list is explicit and intentionally limited to scalar summary fields needed by the DTO helpers.

## Test coverage

The helper is covered through `tests/unit/outbound-webhook-admin-read-model.test.ts`, which is already wired into the aggregate unit runner. Coverage includes safe selection, date-range filters, exact filters, sort output, page-size-plus-one behavior, cursor handling, rejected inputs, and audit labels.

## Next step

The next slice can either expand pure helper edge cases or add a read-adapter contract around this plain query specification before any route or UI uses it.
