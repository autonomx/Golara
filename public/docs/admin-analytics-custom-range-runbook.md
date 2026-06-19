# Admin analytics custom range runbook

This page summarizes the planned custom date range work for `/admin/analytics`.

## Current ranges

Analytics currently supports preset ranges for 7, 30, 90, and 365 days.

## Planned custom range

The planned update will add explicit start and end dates, for example:

- `/admin/analytics?start=2026-06-01&end=2026-06-18`

## Safety rules

- Invalid dates fall back safely.
- Future dates are clamped.
- Existing preset ranges continue to work.
- Business charts, site charts, comparisons, section links, and CSV exports use the same resolved range.

## Implementation notes

This should be a focused range-helper and service-contract refactor. It should not be mixed with new chart types, retention cleanup, or customer analytics.
