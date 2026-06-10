# Admin fulfillment settings localization progress

## Scope

Added a focused guard for `components/admin/AdminFulfillmentSettingsPanel.tsx`.

## Coverage

- Verifies the panel imports and uses `createAdminTranslator(locale)`.
- Verifies all visible fulfillment-method labels remain wrapped in `t(...)`.
- Verifies the shared admin copy dictionary has Persian values for those keys.
- Verifies key raw JSX regressions do not return for the panel heading, save button, or database warning.

## Notes

This is a guard-only slice. Runtime code was already localized through the shared admin translator.
