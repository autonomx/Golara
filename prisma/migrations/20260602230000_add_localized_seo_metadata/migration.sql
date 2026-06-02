-- Phase 7.5: Localized SEO metadata foundation.
-- Adds per-locale SEO fields to existing translation tables without changing global catalog SEO fields.
ALTER TABLE "ProductTranslation"
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalPath" TEXT,
  ADD COLUMN IF NOT EXISTS "seoIndex" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "CategoryTranslation"
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalPath" TEXT,
  ADD COLUMN IF NOT EXISTS "seoIndex" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "HomepageSectionTranslation"
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalPath" TEXT,
  ADD COLUMN IF NOT EXISTS "seoIndex" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "ProductTranslation_locale_canonicalPath_key"
  ON "ProductTranslation" ("locale", "canonicalPath")
  WHERE "canonicalPath" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "CategoryTranslation_locale_canonicalPath_key"
  ON "CategoryTranslation" ("locale", "canonicalPath")
  WHERE "canonicalPath" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "HomepageSectionTranslation_locale_canonicalPath_key"
  ON "HomepageSectionTranslation" ("locale", "canonicalPath")
  WHERE "canonicalPath" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "ProductTranslation_locale_seoIndex_idx"
  ON "ProductTranslation" ("locale", "seoIndex");

CREATE INDEX IF NOT EXISTS "CategoryTranslation_locale_seoIndex_idx"
  ON "CategoryTranslation" ("locale", "seoIndex");

CREATE INDEX IF NOT EXISTS "HomepageSectionTranslation_locale_seoIndex_idx"
  ON "HomepageSectionTranslation" ("locale", "seoIndex");
