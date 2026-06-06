# Phase 35 — Admin Cursor Normalization

This note records cursor-token normalization added to the pure admin read query helper.

## Implemented behavior

`lib/settings/outbound-webhook-admin-read-query.ts` now normalizes cursor tokens before a read plan is built.

The helper accepts trimmed cursor tokens with letters, numbers, colons, underscores, and dashes. Blank cursors become absent cursors. Oversized or unsupported cursor tokens are rejected and treated as absent.

## Boundary

This remains a pure helper. It does not add storage access, endpoint handlers, admin pages, state mutation, external calls, signing, retry work, or recovery controls.

## Test coverage

`tests/unit/outbound-webhook-admin-read-model.test.ts` covers valid cursor tokens, blank cursor tokens, invalid character tokens, oversized cursor tokens, rejected-input summaries, and cursor audit labels.

## Next step

A later slice can add cursor continuation semantics once a real read path exists. Until then, cursor handling remains a safe normalized contract.
