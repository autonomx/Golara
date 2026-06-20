# Admin analytics scheduled report recording repository

This runbook covers the gated scheduled-report recording repository boundary after the owner-only recording, preview, planning, disabled worker, delivery-contract, and retry-planning slices.

## Current scope

The repository boundary is runtime-gated and injected. It is limited to approved owner-only recording flows and remains separate from scheduler, worker, transport, delivery, and retry-planning defaults.

The boundary supports:

- dry-run evidence metadata
- owner approval metadata
- inactive schedule and disabled delivery metadata

## Approved call sites

Approved call sites are limited to the owner-only recording endpoint helpers for dry-run evidence, owner approval, and disable-state metadata.

Dry-run preview and payload preview may build aggregate-only evidence. Schedule planning, disabled worker-shell evaluation, transport contracts, delivery execution contracts, and retry planning remain separated from default repository persistence.

## Required gates

A future enabled path must prove:

- generated Prisma client runtime access
- repository persistence enabled
- target-specific recording enabled
- owner session and owner-role evidence
- global disable control validation
- owner approval policy validation where relevant
- public and staff access blocked
- scheduler disabled by default
- delivery disabled unless a delivery-specific executor is intentionally and fully gated

## Still disabled by default

This boundary does not add:

- public or staff recording access
- arbitrary API routes
- automatic scheduler, timer, or background jobs
- automatic worker execution
- live email or transport delivery
- default payload send behavior
- automatic retry execution
- unbounded retry loops

## Validation checklist

For each validation pass, confirm:

- default gates block repository persistence
- recording endpoints require owner and runtime gates
- dry-run evidence stays limited to dry-run metadata
- owner approval stays limited to approval metadata
- disable-state metadata keeps schedules inactive and delivery disabled unless a future activation slice proves otherwise
- dry-run and payload previews remain aggregate-only
- schedule planning does not persist data
- worker-shell evaluation does not persist data by default
- transport contracts do not persist data by default
- retry planning does not persist data by default
- no public or staff route imports this repository boundary
