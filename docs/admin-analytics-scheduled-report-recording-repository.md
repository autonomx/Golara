# Admin analytics scheduled report recording repository

This runbook covers the gated scheduled-report recording repository boundary.

## Current scope

The repository boundary is runtime-gated and injected. It can only produce a writer when explicit gates are passed by a future audited slice. No app route, management UI, scheduler, background worker, or delivery path calls it.

The boundary defines future write operations for:

- dry-run evidence: `lastDryRunAt` and `lastDryRunSummary`
- owner approval: `ownerApproved` and approval metadata
- global disable state: `isActive`, `deliveryEnabled`, and disable metadata

## Required gates

A future caller must explicitly satisfy these gates before a writer can be created:

- generated Prisma client runtime access enabled
- repository writes enabled
- target-specific recording enabled
- global disable control validated
- owner approval policy validated
- delivery execution disabled
- write endpoint disabled
- management UI disabled
- scheduler disabled

## Still disabled

This slice does not add:

- API route handlers
- server actions
- management UI
- scheduler, timer, or background jobs
- email or transport delivery
- delivery payload execution
- owner override state

## Validation checklist

For each validation pass, confirm:

- default gates block writer creation
- delivery execution blocks writer creation even when other gates are enabled
- the dry-run writer only targets `lastDryRunAt` and `lastDryRunSummary`
- the owner approval writer only targets `ownerApproved` and metadata
- the global disable writer keeps `isActive=false` and `deliveryEnabled=false`
- no app route or component imports this repository boundary
