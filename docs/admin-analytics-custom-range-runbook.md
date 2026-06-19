# Admin analytics custom date range runbook

This runbook defines the implementation path for custom start/end dates on `/admin/analytics`.

## Current baseline

The analytics page supports preset ranges:

- 7 days
- 30 days
- 90 days
- 365 days

Those ranges are handled by `lib/analytics/admin-analytics-range.ts` and are already used by business analytics, site analytics, comparison deltas, section links, and CSV exports.

## Goal

Add explicit start and end dates without breaking the existing range presets.

Target URL examples:

- `/admin/analytics?start=2026-06-01&end=2026-06-18`
- `/admin/analytics?range=30`

## Required helper contract

Add one resolved-range helper that returns a normalized object for both presets and custom dates.

Suggested shape:

```ts
export type AdminAnalyticsResolvedRange = {
  mode: 'preset' | 'custom';
  rangeDays: number;
  startDate: Date;
  endDate: Date;
  query: Record<string, string>;
  label: string;
  compareStartDate: Date;
  compareEndDate: Date;
};
```

## Validation rules

- `start` and `end` must use `YYYY-MM-DD`.
- Reversed dates fall back to the default preset.
- Future end dates clamp to now.
- Ranges over the documented maximum clamp or fall back safely.
- Preset links continue to clear custom dates.
- Custom date links preserve section-anchor navigation and CSV export behavior.

## Implementation sequence

1. Add the resolved-range helper with unit tests.
2. Update order/business summary services to accept the resolved range.
3. Update site analytics summary to accept the resolved range.
4. Update previous-period comparison helpers to use resolved comparison dates.
5. Update `/admin/analytics` range controls and section links.
6. Update `/admin/analytics/export` so Business CSV and Site CSV use the same resolved range.
7. Add source guards for route, services, export, and helper behavior.

## Acceptance tests

- Preset `?range=7` still works.
- Preset `?range=30` still works.
- Preset `?range=90` still works.
- Preset `?range=365` still works.
- Custom `?start=YYYY-MM-DD&end=YYYY-MM-DD` filters business charts.
- Custom `?start=YYYY-MM-DD&end=YYYY-MM-DD` filters site charts.
- Custom ranges preserve section index links.
- Custom ranges preserve Business CSV and Site CSV exports.
- Invalid custom dates fall back safely.

## Rollback boundary

Keep the custom-range refactor isolated to range helpers, analytics summary inputs, route wiring, and export wiring. Avoid mixing it with new chart types, new schema, customer analytics, or retention cleanup.
