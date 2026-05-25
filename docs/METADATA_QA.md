# Metadata QA checklist

Use this checklist after metadata, sitemap, robots, or structured-data changes.

## Required environment

- `NEXT_PUBLIC_SITE_URL` is set to the production domain.
- Production build has been deployed.
- At least one active category exists.
- At least one active product exists.

## Core route checks

Open these routes in production or preview:

```text
/
/sitemap.xml
/robots.txt
/categories/<category-slug>
/products/<product-slug>
```

## Root metadata checks

On `/`:

- title is present.
- description is present.
- canonical URL uses the real domain.
- Open Graph title/description are present.
- Twitter card metadata is present.
- Organization JSON-LD is present.
- WebSite JSON-LD is present.

## Product page checks

On `/products/<product-slug>`:

- title includes product title and Golara.
- description uses product description.
- Open Graph image uses product image.
- Product JSON-LD is present.
- Product JSON-LD includes sku, price, currency, and availability.
- Product BreadcrumbList JSON-LD is present.
- Visible path trail shows Home / Category / Product.
- Checkout and inquiry forms still render.

## Category page checks

On `/categories/<category-slug>`:

- title includes category title and Golara.
- description uses category description.
- Category BreadcrumbList JSON-LD is present.
- Visible path trail shows Home / Category.
- Product cards still render.

## Sitemap checks

On `/sitemap.xml`:

- homepage is present.
- active categories are present.
- active products are present.
- admin URLs are not present.
- API URLs are not present.
- last modified values render valid dates.
- production URLs use `NEXT_PUBLIC_SITE_URL`.

## Robots checks

On `/robots.txt`:

- public routes are allowed.
- `/admin` is disallowed.
- `/api` is disallowed.
- sitemap URL uses the production domain.

## Deferred automated coverage

- Add Playwright smoke checks for metadata routes.
- Add snapshot checks for JSON-LD script presence.
- Add structured-data validation in CI if needed.
