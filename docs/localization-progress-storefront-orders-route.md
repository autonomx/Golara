# Storefront order history route localization guard

## Completed in this slice

- Added a static guard for `app/account/orders/page.tsx`.
- Ensured the no-database fallback resolves storefront locale, applies customer text direction, and passes locale into `SiteHeader`.
- Ensured the signed-in order history branch applies customer text direction and passes the customer locale into `SiteHeader`.
- Guarded English and Persian order-history copy keys, payment summaries, item-count labels, and date locale selection.

## Next candidates

- Public order status route guard.
- Checkout/customer flow parity checks for order status labels that remain raw enum formatting.
- Storefront localization allowlist narrowing after the account and order route guards land.
