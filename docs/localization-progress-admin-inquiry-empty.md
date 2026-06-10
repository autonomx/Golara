# Admin inquiry empty-state localization progress

## Scope

Added guard coverage for `components/admin/InquiryEmptyState.tsx`.

## Coverage

- Verifies the component keeps English and Persian copy maps.
- Verifies locale resolution flows through `resolveStorefrontLocale()` and `localeKey(...)`.
- Verifies the rendered empty-state title, body, and clear-filter actions use localized labels.
- Guards key visible labels against raw JSX regressions.

## Notes

This is a guard-only slice. Runtime behavior was already localized and did not need a component rewrite.
