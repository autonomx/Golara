# Phase 5.35-5.37 accessibility QA

This bundle adds manual accessibility QA guidance for recent Phase 5 navigation and public order work.

## Added docs

- `docs/ACCESSIBILITY_QA.md`

## Checklist coverage

- Keyboard navigation.
- Visible path trail behavior.
- `aria-current` expectations.
- Public order status RTL checks.
- Metadata route reachability.
- Product checkout and inquiry form checks.

## Current scope

This is docs-only. It does not change runtime behavior.

## Deferred

- Automated Playwright keyboard tests.
- axe-core CI checks.
- Formal screen-reader QA pass before launch.
