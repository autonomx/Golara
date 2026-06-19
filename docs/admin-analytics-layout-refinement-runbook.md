# Admin analytics layout refinement runbook

This runbook defines the next UI structure pass for `/admin/analytics`.

## Current baseline

The Analytics page is functional and range-aware, but it now contains many panels:

- guidance and status
- business summary
- order charts
- site analytics
- product conversion
- product sales
- category sales
- fulfillment
- payments
- inquiries
- readiness
- privacy and retention

The section index helps, but the page can still feel long.

## Live preview contract

A preview-only layout contract now groups the existing dashboard anchors into six high-level areas while preserving the selected analytics range:

1. Overview
2. Business
3. Site
4. Products and categories
5. Operations
6. Privacy and docs

The preview contract records that:

- group headers are not enabled yet
- collapsible groups are not enabled yet
- tabs are not enabled yet
- the existing section index must be preserved
- existing range links must be preserved
- accessible table fallbacks remain required for chart panels

## Goal

Make the page easier to scan without losing the current server-rendered, accessible chart approach.

## Recommended grouping

Use the same high-level groups defined by the preview contract:

1. Overview
2. Business
3. Site
4. Products and categories
5. Operations
6. Privacy and docs

## Implementation options

### Option A: anchor groups

Keep one page and group panels with stronger section headers. This is the lowest-risk approach and keeps all existing URLs working.

### Option B: collapsible groups

Keep one page, but make lower-priority sections collapsible. This reduces vertical sprawl while preserving server rendering.

### Option C: tabbed workspace

Add tabs or segmented controls for major analytics groups. This gives the cleanest UI, but requires careful URL and accessibility handling.

## Recommended next slice

Start with Option A:

- Add stronger group headers based on the preview contract.
- Keep the current section index.
- Keep all existing panel anchors.
- Do not change data services.
- Do not add a chart dependency.

## Acceptance criteria

- `/admin/analytics` remains server-rendered.
- Existing range links continue to work.
- Existing section anchors continue to work.
- CSV exports remain available to owners.
- Every chart keeps its accessible table fallback.
- Mobile layout remains readable.

## Follow-up slice

After group headers are stable, evaluate collapsible groups for the longest sections.
