# Admin analytics saved view runbook

This runbook documents the saved dashboard view plan, inactive storage foundation, and read-model foundation for `/admin/analytics`.

## Current state

The implementation is still inactive for operators. It defines named Analytics view presets that reuse the selected Analytics range and existing dashboard section anchors, adds a disabled future-save plan, includes an inactive storage table for future view metadata, and now includes a metadata-only read model for future table rows.

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

## Future-save plan

The plan defines metadata that a later saved-view implementation may record:

- view key
- view label
- optional description
- scope
- intended audience
- selected range mode
- selected range query
- section anchors
- owner approval flag
- active flag

The plan blocks saved-view records from containing report rows, shopper rows, event rows, contact fields, visitor/session identifiers, or export file contents.

Owner approval is required before the plan can become active, but owner approval is not recorded by this foundation.

## Storage foundation

The inactive table is `AdminAnalyticsSavedView`. It stores metadata only and keeps future activation disabled by default:

- `ownerApproved` defaults to `false`
- `isActive` defaults to `false`
- `sectionAnchors` defaults to an empty JSON array
- metadata defaults to an empty JSON object

No application repository writes this table yet.

## Read-model foundation

The read model is metadata-only and inactive. It can normalize future table rows into safe saved-view DTOs with id, view label, scope, audience, selected range query, section anchors, approval flag, and active flag.

The read model rejects invalid rows, deduplicates anchors, and keeps operator activation disabled. No page, route, or management UI calls it yet.

## Disabled until a later phase

Disabled paths:

- view saving
- client-side saved state
- server-side saved state
- save endpoint
- update endpoint
- remove endpoint
- read endpoint
- management UI
- role policy persistence
- active repository reads or writes

Do not add an active save endpoint, read endpoint, or management UI until permission enforcement, owner approval capture, audit logging, and rollback evidence are approved.

## Validation checklist

Before moving from foundation to saved views, confirm:

1. Presets keep the selected preset or custom date range in their URLs.
2. Presets use existing section anchors only.
3. Owner-only view presets remain clearly marked as owner audience.
4. Staff view presets do not expose owner-only controls by themselves.
5. The plan only allows saved-view metadata.
6. Blocked fields include report rows, shopper rows, event rows, contact fields, visitor/session identifiers, and export file contents.
7. Owner approval is required and not yet recorded.
8. Save/update/remove/read endpoints, active repository access, and management UI remain disabled.
9. The storage table exists for metadata only.
10. The read model returns metadata-only DTOs and keeps operator activation disabled.
11. Source guards prove saved views do not alter analytics calculations.

## Future implementation notes

A later saved-view implementation should define:

- rollback evidence for view metadata
- explicit owner/staff management screens
- role-policy enforcement for saved view scopes
- audit log expectations for created, updated, and removed saved view metadata
- disable controls for owner-managed saved views
- export/analytics parity checks for saved range links
