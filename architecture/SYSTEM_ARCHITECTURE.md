# Golara System Architecture

## Purpose

Golara is a production-oriented ecommerce storefront and CMS for a luxury floral shop. The current implementation is optimized for fast iteration while preserving clean boundaries between storefront rendering, CMS data, customer account/auth, checkout/order state, media assets, and production-readiness seams.

The app intentionally uses public product/category facts for realistic test data while keeping copy, implementation, and generated media assets owned by Golara.

## Current stack

- **Framework:** Next.js App Router.
- **Language:** TypeScript.
- **Data layer:** Prisma with PostgreSQL when `DATABASE_URL` is configured.
- **Fallback mode:** Seeded in-memory/static content when no database is configured.
- **Admin:** Password/session-protected admin CMS with role checks.
- **Customer auth:** Phone-first OTP sign-in with provider seam for message delivery.
- **Media:** Local/public image asset routes, generated seed assets, upload/URL registration through admin.
- **CI:** GitHub Actions build/type/test gate before merge.

## High-level module map

```text
app/
  page.tsx                         Storefront homepage
  products/                        Product listing/detail surfaces
  categories/[slug]/page.tsx       Category/subcategory storefront pages
  account/                         Customer account, login, orders, addresses, profile
  checkout/                        Cart and checkout flow
  admin/                           CMS/admin pages and server actions
  seed-images/                     Runtime image serving routes and SVG fallbacks

components/
  ProductCard.tsx                  Product cards
  HomepageCategoryTileCard.tsx     Category/subcategory image tiles
  SiteHeader.tsx                   Shared navigation/header
  admin/                           CMS/admin presentation components

lib/
  catalog.ts                       Shared storefront data types and formatting helpers
  category-tree.ts                 Category hierarchy and recursive product helpers
  cms/catalog-repository.ts        Prisma-backed reads with seeded fallback
  seed-data.ts                     Seed catalog, products, homepage content
  seed-product-images.ts           Product placeholder/image route helpers
  prisma.ts                        Prisma availability and client wiring
  admin-*                          Admin auth/audit helpers
  customer-*                       Customer auth/session/profile helpers
  message-delivery/                OTP delivery provider seam
  localization/                    Storefront copy registry

prisma/
  schema.prisma                    Database schema
  seed.ts                          Seed database from `lib/seed-data.ts`

public/
  seed-images/photo-real/          Generated product/category-style photo assets
  seed-images/category-real/       Generated category/subcategory image assets
  uploads/                         Local uploaded media in dev/local mode

architecture/
  *.md                             Architecture design notes
```

## Runtime modes

### 1. Seeded preview mode

When no database is configured, repository reads fall back to `lib/seed-data.ts`. This keeps the storefront usable for local preview, UI work, and CI builds.

In this mode:

- Storefront pages render seeded categories/products/homepage content.
- Admin write actions are disabled because there is no persistent database.
- Category and product image routes still serve generated/static assets when present.

### 2. Database-backed CMS mode

When `DATABASE_URL` is configured and Prisma is generated/migrated, the app reads and writes catalog data through Prisma.

Typical setup:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run build
```

In this mode:

- Categories, products, homepage content, media, inquiries, customers, orders, and audit logs are persisted.
- Admin forms write to Prisma through server actions.
- Storefront pages revalidate after CMS writes.

## Core data ownership

### Category

Categories are the source of truth for storefront navigation and homepage category tiles.

Important fields:

- `slug` — route and image identity.
- `title`, `eyebrow`, `description` — storefront copy.
- `parentId` — optional parent category; null means top-level category.
- `imageUrl` — editable category image URL.
- `showOnHomepage` — controls homepage category tile visibility.
- `isActive` — controls storefront visibility.
- `sortOrder` — deterministic display order.

Categories and subcategories share the same table. A subcategory is simply a category with `parentId` set.

### Product

Products belong to one category. That category can be either top-level or a subcategory.

Important fields:

- `slug`, `code`, `title`, `description`.
- `categoryId`.
- `priceCents`, `currency`, `requiresQuote`.
- `imageUrl`.
- `availableToday`, `bestSeller`, `isActive`.

Parent category pages aggregate products assigned to all descendant categories through `lib/category-tree.ts`.

### Media

Media records store reusable image URLs and alt text for admin selection. Media can point at:

- external URLs,
- local uploaded files,
- generated public assets,
- future object-storage URLs.

### Homepage content

Homepage hero content is stored in `HomepageSection` with key `home.hero`. The current payload merges persisted values with seeded defaults for backwards compatibility.

### Customer profile/account/session

Customer identity is phone-first. `CustomerProfile` stores customer-facing identity and contact information. `CustomerAccount` stores provider-specific identity, and `CustomerSession` stores authenticated session state.

### OTP challenge

OTP challenge records track destination, purpose, expiration, attempt count, and consumed state. Delivery is delegated to the message delivery provider seam.

### Cart and checkout order

`CartSession` and `CartItem` represent cart state. Checkout creates `CheckoutOrder`, `CheckoutOrderItem`, `CheckoutPaymentAttempt`, and `CheckoutOrderTimelineEvent` records.

Orders support inquiry/manual-payment flows today, with payment-provider integration deferred behind provider-like boundaries.

## Storefront data flow

### Homepage

```text
app/page.tsx
  -> getHomepageContent()
  -> listCategories()
  -> listHomepageCategories()
  -> listProducts()
  -> withCategoryProductCounts()
  -> HomepageCategoryTileCard + ProductCard
```

The homepage category grid is CMS-driven. Any active category or subcategory with `showOnHomepage = true` can appear.

Category tile images resolve from `category.image` or `/seed-images/category-real/<slug>`.

### Category page

```text
app/categories/[slug]/page.tsx
  -> getCategoryBySlug(slug)
  -> listCategories()
  -> listProducts()
  -> childCategoriesFor()
  -> descendantCategoriesFor()
  -> productsForCategoryTree()
```

Category pages show direct child categories as tiles. Product grids include products assigned to the current category and all descendants.

### Product pages and cards

Product surfaces read product data through `listProducts()`, `getProductBySlug()`, and related repository helpers. Product cards use product images from `product.image`, with generated seeded image routes already available for seeded products.

## CMS/admin data flow

Admin pages receive data from repository read helpers and write through server actions in `app/admin/actions.ts`.

Important write actions:

- create/update media URL.
- upload media.
- create/update category.
- create/update product.
- update homepage content.

Admin actions:

1. assert admin role;
2. verify database availability;
3. normalize/validate form fields;
4. write through Prisma;
5. record admin audit log;
6. revalidate storefront/admin routes;
7. redirect with status.

## Image architecture

Golara uses owned/generated image assets and image-serving routes rather than copying source-site assets.

### Product real-photo route

Product photo assets live under:

```text
public/seed-images/photo-real/
```

The real-photo product route serves committed JPG/PNG/WebP files when available and falls back to generated SVG product art.

### Category real-photo route

Category image requests use:

```text
/seed-images/category-real/<slug>
```

Resolution order:

1. exact asset in `public/seed-images/category-real/<slug>.(jpg|png|webp)`;
2. mapped shared asset alias in `public/seed-images/category-real/` or `public/seed-images/photo-real/`;
3. exact asset in `public/seed-images/photo-real/<slug>.(jpg|png|webp)`;
4. generated SVG category fallback at `/seed-images/category/<slug>`.

The alias layer exists because some generated category images were uploaded with practical names like `vip-flower-box.jpg`, `standard-bouquet.jpg`, or `vases.jpg` rather than exact category slugs.

### Future media direction

The current local/public asset approach is good for seed data and early production. A future production deployment should move uploaded admin media to object storage such as S3, Cloudinary, or equivalent, while keeping public generated seed assets in the repo or CDN.

## Customer auth architecture

Customer sign-in is phone-first OTP.

Core flow:

```text
Customer enters phone
  -> create CustomerOtpChallenge
  -> message delivery provider sends OTP
Customer enters OTP
  -> verify code hash and attempt count
  -> create/find CustomerProfile
  -> create CustomerAccount / update verification fields
  -> create CustomerSession
```

Message delivery modes currently include development/log/disabled style paths plus provider seam support. A concrete production SMS vendor adapter is a known production gap unless already configured in the deployment environment.

## Checkout/order architecture

The checkout foundation supports cart, order creation, order status, manual/inquiry payment workflows, and order timeline events.

Current boundaries:

- Cart state is separate from order state.
- Payment attempts are separate from checkout order records.
- Fulfillment fields are stored on `CheckoutOrder`.
- Timeline events provide an audit/history surface for customer/admin UX.

Future payment provider adapters should write `CheckoutPaymentAttempt` state transitions and order timeline events rather than mutating order status opaquely.

## Security and production notes

Current security foundations include:

- admin authentication and role assertions for write actions;
- customer OTP challenge expiration and attempt counts;
- customer session records with expiry/revocation fields;
- audit logs for admin writes;
- account security/privacy review docs from earlier phases.

Known production gaps to keep visible:

- concrete SMS vendor adapter configuration must be completed before real OTP launch;
- IP-level and device-level throttling should be added for OTP endpoints;
- object storage should replace local uploads for production admin media;
- production smoke tests should be added for homepage, product page, category page, cart, checkout, login, and account redirects;
- broader Persian storefront localization is still ongoing.

## CI and merge policy

All implementation PRs should be merged only after CI passes and GitHub reports the PR is mergeable.

The current working style is intentionally small-bundle:

1. create a focused branch;
2. make additive changes;
3. open PR;
4. wait for CI;
5. merge only if CI passed and mergeability is true;
6. document major architecture/product changes.

## Current architecture strengths

- Storefront works with or without a database.
- CMS writes are gated behind server actions and role checks.
- Category hierarchy is now real data, not hardcoded homepage tiles.
- Category and product image systems avoid copying source-site assets.
- Recursive category product aggregation supports deep navigation trees.
- Product count badges make category QA and merchandising easier.
- Message delivery and payment attempt concepts are provider-friendly.

## Current architecture risks

- Category image aliases are still embedded in a route; a future migration should move aliases into seed data or CMS fields.
- Admin media upload is local/dev oriented and needs object storage for production.
- Some category/page behavior is direct server-component logic; future growth may justify stronger service modules.
- Product filtering/search/sorting are still basic.
- Localization is partial and should become more systematic.
- Production SMS and rate-limiting are not complete enough for full public launch.

## Recommended next architecture documents

1. `CATALOG_ARCHITECTURE.md` — detailed category/product/media model, seed workflow, and admin editing flows.
2. `CHECKOUT_ARCHITECTURE.md` — cart/order/payment/fulfillment/timeline state machine.
3. `CUSTOMER_ACCOUNT_ARCHITECTURE.md` — OTP, sessions, profiles, addresses, privacy/security.
4. `MEDIA_ARCHITECTURE.md` — generated assets, public routes, upload storage, CDN/object-storage plan.
5. `DEPLOYMENT_ARCHITECTURE.md` — env vars, migration/seed flow, CI, staging/prod launch checklist.
