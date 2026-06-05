# Phase 35 — Admin Read Plan Helper

This note records the small planning helper added after the admin read query helper.

## Implemented helper

`lib/settings/outbound-webhook-admin-read-plan.ts` adds list and detail plan builders for admin read flows.

The builders return a plain object with:

- read kind
- query specification
- optional delivery id
- audit labels
- rejected-input summary

## Boundary

The helper is a pure planner. It does not add storage access, admin pages, endpoint handlers, state mutation, external calls, signing, retry work, or recovery controls.

The detail planner trims the delivery id and records whether it is present. It preserves rejected-input details from the query-spec helper.

## Test coverage

`tests/unit/outbound-webhook-admin-read-model.test.ts` covers list plans, detail plans, delivery id trimming, missing delivery id handling, audit labels, and rejected-input propagation.

## Next step

A later slice can add an in-memory adapter contract or more pure edge-case coverage before any user-facing admin surface consumes these helpers.
