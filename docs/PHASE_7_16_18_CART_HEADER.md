# Phase 7.16-7.18 cart header affordance

This bundle adds the first persistent cart affordance to the shared site header.

## Added behavior

- Converts the decorative cart icon into a real `/cart` link.
- Reads the HTTP-only cart token cookie server-side.
- Shows a cart item-count badge when a database-backed active cart exists.
- Uses an accessible cart label that includes the item count.
- Keeps search/account icons non-interactive placeholders for now.

## Current scope

This is intentionally limited to the shared header cart affordance. It does not add client-side cart state, search, customer accounts, or mobile navigation changes.

## Follow-up bundles

1. Cart checkout localization and field-level validation polish.
2. Basic cart smoke-test documentation or automation.
3. Phase 7 closeout once cart/session checkout is stable.
