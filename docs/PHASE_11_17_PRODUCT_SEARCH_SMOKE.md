# Phase 11.17 — Product search smoke coverage

Status: pending CI.

## Completed

- Added product search empty-state coverage to the route smoke suite.
- The smoke route checks `/products?q=nomatchflower` and accepts English or Persian empty-state copy.

## Verification

- CI is required before merge.

## Next

- Continue adding customer-facing route smoke coverage for checkout and account-adjacent paths.
- Add focused unit coverage where route smoke cannot exercise signed-in customer locale behavior.
