# Admin analytics saved view runbook

This runbook documents the saved dashboard view persistence-plan foundation for `/admin/analytics`.

## Current state

The implementation is plan-only. It defines named Analytics view presets that reuse the selected Analytics range and existing dashboard section anchors, then layers a disabled persistence plan over those presets.

The current contract includes:

- Business performance view
- Site funnel view
- Order cohort view
- Operations readiness view

Each preset records:

- preset key and label
- intended audience: owner or staff
- view scope: owner-private, staff-shared, or store-wide owner-managed
- allowed manager audience
- selected range label and query string
- dashboard URL with the selected range preserved
- first section anchor for the view
- ordered section list for the view

## Persistence plan

The plan defines the metadata that a later saved-view implementation may persist:

- view key
- view label
- scope
- selected range query
- section anchors

The plan also names fields that must not be persisted as saved-view records:

- analytics rows
- customer rows
- raw event rows
- customer contact fields

Owner approval is required before the plan can become active, but owner approval is not recorded by this foundation.

## Disabled until a later phase

Disabled paths:

- view saving
- client-side saved state
- server-side saved state
- save endpoint
- update endpoint
- remove endpoint
- management UI
- role policy persistence

Do not add an active save endpoint or management UI until a separate schema and permission design is approved.

## Validation checklist

Before moving from persistence plan to saved views, confirm:

1. Presets keep the selected preset or custom date range in their URLs.
2. Presets use existing section anchors only.
3. Owner-only view presets remain clearly marked as owner audience.
4. Staff view presets do not expose owner-only controls by themselves.
5. The persistence plan only allows saved-view metadata.
6. Blocked fields include analytics rows, customer rows, raw event rows, and customer contact fields.
7. Owner approval is required and not yet recorded.
8. Save/update/remove endpoints and management UI remain disabled.
9. Source guards prove saved views do not alter analytics calculations.

## Future implementation notes

A later saved-view implementation should define:

- migration and rollback evidence for view metadata
- explicit owner/staff management screens
- role-policy enforcement for saved view scopes
- audit log expectations for created, updated, and removed saved view metadata
- disable controls for owner-managed saved views
