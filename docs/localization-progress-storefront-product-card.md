# Storefront product card localization guard

Phase: storefront localization completion.

This slice adds a focused guard for `components/ProductCard.tsx`.

Covered:
- product card action labels stay routed through `storefront-copy`
- product badges stay localized
- the product card view aria label stays formatted through storefront copy
- English and Persian storefront copy keys remain present

Next storefront slices should continue with compact storefront components before narrowing `components/storefront/**` or broader component allowlists.
