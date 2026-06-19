# Admin analytics view preset runbook

This runbook documents the saved dashboard view preview foundation for `/admin/analytics`.

## Current state

The implementation is preview-only. It defines named Analytics view presets that reuse the selected Analytics range and existing dashboard section anchors.

The current preview contract includes:

- Business performance view
- Site funnel view
- Order cohort view
- Operations readiness view

Each preset records:

- preset key and label
- intended audience: owner or staff
- selected range label and query string
- dashboard URL with the selected range preserved
- first section anchor for the view
- ordered section list for the view

## Disabled until a later phase

The preview foundation does not save anything yet.

Disabled paths:

- view saving
- client-side saved state
- server-side saved state
- saved role policy

Do not add a persistence model, browser-backed state, or save endpoint until a separate design is approved.

## Validation checklist

Before moving from preview to saved views, confirm:

1. Presets keep the selected preset or custom date range in their URLs.
2. Presets use existing section anchors only.
3. Owner-only view presets remain clearly marked as owner audience.
4. Staff view presets do not expose owner-only controls by themselves.
5. Saving remains disabled in the preview contract.
6. Any future persistence stores only view metadata, not analytics rows.

## Future implementation notes

A later saved-view persistence phase should define:

- the owner/staff permission boundary
- metadata fields that may be saved
- whether views are per-user, per-role, or store-wide
- a delete/update flow for saved metadata
- migration and rollback evidence
- source guards proving saved views do not alter analytics calculations
