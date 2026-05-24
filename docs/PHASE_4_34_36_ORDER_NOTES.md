# Phase 4.34-4.36 order notes

This bundle adds manual staff notes to order timelines.

## Added foundation

- `addOrderTimelineNoteAction` server action.
- Staff-or-owner role enforcement for timeline notes.
- Audit log event for staff notes.
- Order detail page timeline note form.
- Success banner after a note is added.

## Current behavior

Staff can add internal notes from the order detail page. Notes are stored as `staff_note` timeline events and also update the order's current `staffNotes` field.

## Rules

- Notes require an authenticated admin with at least staff role.
- Empty/one-character notes are rejected.
- Adding a note revalidates `/admin` and the order detail page.

## Deferred

- Editing or deleting notes.
- Public/customer-visible notes.
- Note categories or fulfillment tags.
