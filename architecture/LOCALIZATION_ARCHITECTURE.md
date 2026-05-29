# Golara Localization Architecture

## Purpose

Define the multilingual content strategy before more catalog, CMS, checkout, and customer-account copy accrues.

Golara currently has Persian-first defaults in several customer-facing areas, including `fa-IR` locale defaults and `TOMAN` checkout currency defaults. The next production-safe step is to make localization explicit before adding more storefront copy and admin editing surfaces.

## Goals

- Support Persian-first storefront and checkout experiences.
- Support English fallback content for operators, previews, and future bilingual storefronts.
- Keep existing storefront behavior compatible while localization fields are introduced gradually.
- Avoid scattering locale branching logic through route components.
- Preserve admin editing clarity: staff should know which locale they are editing.
- Keep URL, cookie, and database behavior explicit.

## Non-goals

- This document does not implement the schema migration.
- This document does not translate existing catalog copy.
- This document does not add a locale switcher UI.
- This document does not introduce a third-party i18n framework requirement.

## Supported locales

Initial supported locales:

| Locale | Role | Direction | Notes |
| --- | --- | --- | --- |
| `fa-IR` | Primary | RTL | Default customer-facing locale. |
| `en-CA` | Secondary/fallback | LTR | Operator-friendly and future bilingual storefront fallback. |

Additional locales should require an explicit product/content decision.

## Recommended storage decision

Use **translation tables** for long-lived CMS/catalog copy rather than column-per-locale fields.

Reasoning:

- Category, product, homepage, and future editorial copy will grow over time.
- Translation tables avoid wide models such as `titleFa`, `titleEn`, `descriptionFa`, `descriptionEn`, repeated across every content model.
- Translation tables make it easier to add locale-specific publishing state later.
- Translation tables keep fallback behavior explicit per content record.
- Translation tables scale better if more locales are added later.

Column-per-locale can still be acceptable for small operational labels or immutable enum display text, but primary CMS/catalog content should use translation records.

## Proposed schema pattern

### Category translations

```prisma
model CategoryTranslation {
  id          String   @id @default(cuid())
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  locale      String
  title       String
  eyebrow     String?
  description String?
  imageAlt    String?
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([categoryId, locale])
  @@index([locale, isPublished])
}
```

### Product translations

```prisma
model ProductTranslation {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  locale      String
  title       String
  description String?
  imageAlt    String?
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([productId, locale])
  @@index([locale, isPublished])
}
```

### Homepage translations

`HomepageSection` already stores flexible JSON payloads. For homepage and editorial sections, prefer one row per key/locale pair instead of locale fields inside unstructured payloads:

```prisma
model HomepageSectionTranslation {
  id         String          @id @default(cuid())
  sectionId  String
  section    HomepageSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  locale     String
  title      String?
  subtitle   String?
  body       String?
  payload    Json?
  isPublished Boolean       @default(true)
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  @@unique([sectionId, locale])
  @@index([locale, isPublished])
}
```

## Locale resolution

Recommended resolution order:

1. Explicit URL segment, for example `/fa/...` or `/en/...`, once routes are introduced.
2. Locale cookie set by a future language switcher.
3. Customer profile locale when authenticated.
4. `Accept-Language` header when safe and supported.
5. Default locale: `fa-IR`.

For the current app, keep routes compatible and defer URL segment migration until the catalog translation records exist.

## URL policy

Recommended future URL policy:

- Persian primary pages may remain at canonical existing routes during migration.
- English pages should use an explicit segment such as `/en` to avoid duplicate-content ambiguity.
- Product/category slugs should remain stable identifiers initially; translated slug support can be a later SEO phase.

Initial route behavior:

```text
/                  -> fa-IR
/products/...      -> fa-IR
/en                -> en-CA
/en/products/...   -> en-CA
```

## Fallback policy

Fallback should be explicit and predictable.

When requested locale content is unavailable:

1. Try requested locale translation if published.
2. Fall back to `fa-IR` translation if published.
3. Fall back to the legacy base record fields during migration.
4. As a last resort, fall back to `en-CA` translation if present.

Admin preview surfaces should indicate when fallback content is being shown.

## Admin editing policy

Admin CMS should eventually expose locale-aware tabs or filters:

- Persian (`fa-IR`)
- English (`en-CA`)

Each translatable entity should show:

- locale completeness;
- publish status per locale;
- fallback source when a locale is missing;
- last updated timestamp per translation.

Avoid saving translations implicitly when staff edit only the base/legacy record during migration.

## Runtime helper seams

Recommended helper modules:

- `lib/i18n/locales.ts`
  - supported locale constants;
  - locale normalization;
  - fallback locale selection.
- `lib/i18n/resolve-locale.ts`
  - request/cookie/profile locale resolution.
- `lib/i18n/translated-content.ts`
  - translation selection and fallback utilities.

Content repositories should call shared helpers rather than implementing fallback logic independently.

## Migration strategy

### Phase 19.2 — Schema foundation

- Add translation tables for products and categories first.
- Add helper types and fallback selection utilities.
- Keep legacy fields as canonical fallback during migration.

### Phase 19.3 — Repository fallback migration

- Update catalog repository reads to load translations and project localized view models.
- Keep current storefront props compatible where possible.
- Add tests for requested locale, Persian fallback, and legacy fallback.

### Phase 19.4 — Admin editing migration

- Add locale tabs or selectors to admin product/category forms.
- Add completeness indicators.
- Preserve legacy editing until translation records are seeded.

### Phase 19.5 — Routing and UX

- Add URL/cookie locale resolution.
- Add language switcher.
- Add `dir="rtl"` / `dir="ltr"` layout handling per locale.

## Open decisions

- Whether translated slugs are needed before launch or can be deferred.
- Whether English should be `en-CA` only or generic `en` in URLs.
- Whether translation publish state should block storefront display or only warn admins.
- Whether checkout transactional messages should use the same translation tables or a separate message catalog.
