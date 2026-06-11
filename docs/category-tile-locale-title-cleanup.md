# Category tile locale title cleanup

The production category database can contain legacy bilingual titles such as `باکس گل Flower Box` when a clean translation row is not available.

Storefront category tiles now derive a locale-specific display title before rendering card text, alt text, and accessibility labels:

- English cards remove Persian-script fragments from mixed legacy titles.
- Persian cards remove Latin fragments from mixed legacy titles.
- Single-language titles remain unchanged.

This keeps `/categories` and homepage category tiles from showing English and Persian in the same card while avoiding an immediate production data rewrite.
