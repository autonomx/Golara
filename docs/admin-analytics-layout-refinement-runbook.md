# Admin analytics layout refinement runbook

This runbook defines the UI structure pass for `/admin/analytics`.

## Current baseline

The Analytics page is functional, range-aware, and now includes static dashboard group headers for the major analytics areas:

- Overview
- Business
- Site
- Products and categories
- Operations
- Privacy and docs

The existing section index remains available for direct jumps to individual panels.

## Live group header contract

The layout contract groups the existing dashboard anchors into six high-level areas while preserving the selected analytics range:

1. Overview
2. Business
3. Site
4. Products and categories
5. Operations
6. Privacy and docs

The live contract records that:

- group headers are enabled
- collapsible groups are not enabled yet
- tabs are not enabled yet
- the existing section index must be preserved
- existing range links must be preserved
- accessible table fallbacks remain required for chart panels

## Goal

Make the page easier to scan without losing the current server-rendered, accessible chart approach.

## Implemented approach

### Option A: anchor groups

The current implementation keeps one page and adds stronger group-header cards. This is the lowest-risk approach and keeps all existing URLs working.

## Later options

### Option B: collapsible groups

Keep one page, but make lower-priority sections collapsible. This reduces vertical sprawl while preserving server rendering.

### Option C: tabbed workspace

Add tabs or segmented controls for major analytics groups. This gives the cleanest UI, but requires careful URL and accessibility handling.

## Recommended next slice

Do not add Option B or C until the static group-header UI has production validation evidence.

If more layout work is needed later:

- Preserve the current section index.
- Preserve all existing panel anchors.
- Keep the selected range in generated links.
- Do not change data services.
- Do not add a chart dependency.

## Acceptance criteria

- `/admin/analytics` remains server-rendered.
- Existing range links continue to work.
- Existing section anchors continue to work.
- CSV exports remain available to owners.
- Every chart keeps its accessible table fallback.
- Mobile layout remains readable.
- Collapsible groups and tabs remain disabled until explicitly implemented.

## Follow-up slice

After group headers are stable, evaluate collapsible groups for the longest sections only if the page still feels crowded.
