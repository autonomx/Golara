# Admin settlement route localization progress

Status: in progress

This slice extends the payment route guard work with focused coverage for `app/admin/payments/settlement/page.tsx`.

Covered now:

- Locale resolution through `resolveStorefrontLocale()`.
- Admin translator wiring through `createAdminTranslator(locale)`.
- Localized route shell labels, action links, and authentication messages.
- English and Persian dictionary coverage for the guarded route strings.

This is a guard-only slice; no runtime behavior is intended to change.
