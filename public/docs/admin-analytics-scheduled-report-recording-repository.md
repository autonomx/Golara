# Admin analytics scheduled report recording repository

This runbook covers the gated scheduled-report recording repository boundary.

The boundary is injected and gated. It does not connect to app routes, management UI, scheduler jobs, background jobs, or delivery execution.

## Current scope

The boundary describes future recording targets for:

- dry-run evidence fields
- owner approval fields
- global disable fields

## Required gates

A future audited caller must provide:

- generated client runtime access
- repository write permission
- target-specific recording enablement
- global disable validation
- owner approval validation
- delivery still disabled
- management UI still disabled
- scheduler still disabled

## Validation checklist

Confirm that default gates block recording, delivery-enabled state blocks recording, and no app route or component imports the boundary.
