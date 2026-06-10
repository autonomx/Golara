# Admin inquiry contact localization guard

Added focused guard coverage for `InquiryContactActions`.

Coverage:
- locale resolution stays wired through the storefront locale helper
- contact action labels stay selected from localized copy maps
- English and Persian copy keys remain present
- direct JSX label regressions are blocked for guarded actions

This keeps inquiry contact shortcuts covered while the larger inquiry board remains a separate localization slice.
