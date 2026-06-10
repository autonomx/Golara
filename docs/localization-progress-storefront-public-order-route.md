# Storefront public order status route localization guard

## Completed in this slice

- Added a static guard for `app/orders/[token]/page.tsx`.
- Normalized the query locale once and reused it for public order copy, text direction, status labels, date formatting, and `SiteHeader`.
- Guarded English and Persian public order copy, status labels, result banners, payment guidance, and language toggle wiring.

## Next candidates

- Review remaining raw public enum formatting in customer/order surfaces.
- Narrow storefront localization allowlists once the guarded storefront/account/order routes are stable.
- Return to admin backlog slices such as `InquiryBoard.tsx` extraction/localization.
