# Admin analytics saved view runbook

This runbook documents the saved dashboard view persistence-plan, inactive storage schema, and read-model foundation for `/admin/analytics`.

## Current state

The implementation remains inactive for operators. It defines named Analytics view presets that reuse the selected Analytics range and existing dashboard section anchors, layers a disabled persistence plan over those presets, includes an inactive storage schema foundation for future saved-view metadata, and now includes a metadata-only read-model normalizer for future table rows.

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
- optional description
- scope
- intended audience
- selected range mode
- selected range query
- section anchors
- owner approval flag
- active flag

The plan also names fields that must not be persisted as saved-view records:

- analytics rows
- customer rows
- raw event rows
- customer contact fields
- visitor or session identifiers
- export file contents

Owner approval is required before a saved-view record can become active, but owner approval is not recorded by this foundation.

## Storage schema foundation

The inactive schema foundation adds the `AdminAnalyticsSavedView` migration table for future owner-managed view metadata. The migration stores only view metadata and defaults future activation fields to disabled:

- `ownerApproved` defaults to `false`
- `isActive` defaults to `false`
- `sectionAnchors` defaults to an empty JSON array
- metadata defaults to an empty JSON object

The unique key is `(viewKey, scope)` so the future management UI can prevent duplicate saved views inside the same visibility scope.

No application repository writes this table yet.

## Read-model foundation

The read-model foundation is metadata-only and inactive. It can normalize future `AdminAnalyticsSavedView` rows into DTOs that contain only:

- id
- view key and label
- optional description
- scope and audience
- selected range mode and query
- section anchors and first section anchor
- owner approval flag
- active flag

The normalizer rejects invalid scope, invalid audience, missing range query, and rows without approved section anchors. It deduplicates anchors and keeps `activeForOperators=false` even when a row carries future approval flags.

Repository reads are still disabled. No page, API route, or management UI calls the read model yet.

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

Do not add an active save endpoint, read endpoint, or management UI until permission enforcement, owner approval capture, audit logging, rollback evidence, and source-of-truth ownership are approved.

## Validation checklist

Before moving from schema/read-model foundation to active saved views, confirm:

1. Presets keep the selected preset or custom date range in their URLs.
2. Presets use existing section anchors only.
3. Owner-only view presets remain clearly marked as owner audience.
4. Staff view presets do not expose owner-only controls by themselves.
5. The persistence plan only allows saved-view metadata.
6. Blocked fields include analytics rows, customer rows, raw event rows, customer contact fields, visitor/session identifiers, and export file contents.
7. Owner approval is required and not yet recorded.
8. Save/update/remove endpoints and management UI remain disabled.
9. The `AdminAnalyticsSavedView` migration exists and stores metadata only.
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
