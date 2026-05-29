# Phase 19.6 — Homepage translation editing

## Goal

Extend the admin translation surface beyond product/category records by adding homepage hero translation editing and loading existing homepage translation values.

## Implemented

- Added `HomepageTranslation` metadata type.
- Added `lib/cms/homepage-translation-repository.ts`.
- Added `listHomepageTranslations()` for admin reads.
- Added `upsertHomepageTranslationAction()`.
- Updated `/admin` to load homepage translation records for authenticated admins.
- Updated `AdminDashboard` to pass homepage translation metadata into `AdminTranslationPanel`.
- Updated `AdminTranslationPanel` to render homepage translation forms for each supported locale.
- Added homepage translation completeness summary counts.
- Added admin status label for saved homepage translations.

## Homepage translation fields

The homepage translation form supports:

- eyebrow;
- title;
- body;
- primary CTA label;
- primary CTA URL;
- secondary CTA label;
- secondary CTA URL;
- panel eyebrow;
- panel title;
- panel body;
- publish state.

The title and body are required for the current completeness policy.

## Storage behavior

Homepage translations are stored in `HomepageSectionTranslation`:

- `title` stores the translated hero title;
- `subtitle` stores the translated hero eyebrow;
- `body` stores the translated hero body;
- `payload` stores CTA and panel copy.

If the base `home.hero` section does not exist yet, the write action creates it from seeded homepage content before creating the translation record.

## Safety behavior

- Translation writes remain owner-only through the existing CMS write guard.
- Existing base homepage editing remains unchanged.
- Existing storefront routes remain unchanged.
- Catalog paths are revalidated after homepage translation writes.
- Admin audit logs are written for homepage translation upserts.

## Follow-up

Phase 19.7 should add storefront route/cookie locale resolution and a language switcher so customer-facing pages can request the localized catalog/homepage projections added in earlier phases.
