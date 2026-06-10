# Admin payment providers localization guard

## Scope

This slice adds focused source and key coverage for the payment provider readiness route.

## Coverage

- Confirms the route resolves locale and direction before rendering.
- Confirms fixed route-shell labels stay wrapped with the admin translator.
- Confirms guarded labels have Persian admin-copy coverage.
- Blocks direct JSX regressions for key route labels.

## Follow-up

Long diagnostic copy remains wrapped and can be moved to structured copy helpers in a later dynamic copy parity slice.
