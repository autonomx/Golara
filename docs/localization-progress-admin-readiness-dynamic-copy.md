# Admin readiness dynamic copy localization

## Slice

Localized the dynamic readiness card content used by the admin overview/readiness panels when Persian is selected.

## Why

The admin shell and route wrapper were already localized, but runtime readiness issue objects still supplied English summaries, details, issue codes, mode values, provider names, and dynamic card labels. In Persian mode this produced mixed-language cards such as `Checkout remains inquiry-first`, `Inquiry notifications are log-only`, `checkout_inquiry_mode`, and `manual`.

## Changes

- Expanded `lib/localization/admin-readiness-copy.ts` to translate known readiness issue summaries/details/codes and mode/provider values.
- Added helpers for dynamic issue summaries/details, issue lines, and card labels.
- Updated `components/admin/AdminReadinessPanel.tsx` to use those helpers for actual blocker/warning issue objects instead of rendering raw issue fields.
- Expanded `tests/unit/admin-readiness-panel-copy.test.ts` to guard the screenshot regression strings and Persian dynamic card labels.

## Verification

GitHub Actions CI is the source of truth for this slice.
