CREATE TABLE IF NOT EXISTS "HomepageBannerMediaSetting" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "locale" TEXT,
  "eyebrow" TEXT,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "mediaId" TEXT,
  "imageUrl" TEXT,
  "imageAlt" TEXT,
  "ctaLabel" TEXT,
  "ctaHref" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomepageBannerMediaSetting_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "HomepageBannerMediaSetting_key_locale_key" ON "HomepageBannerMediaSetting" ("key", COALESCE("locale", ''));
CREATE INDEX IF NOT EXISTS "HomepageBannerMediaSetting_locale_isActive_idx" ON "HomepageBannerMediaSetting" ("locale", "isActive");
CREATE INDEX IF NOT EXISTS "HomepageBannerMediaSetting_mediaId_idx" ON "HomepageBannerMediaSetting" ("mediaId");
CREATE INDEX IF NOT EXISTS "HomepageBannerMediaSetting_sortOrder_idx" ON "HomepageBannerMediaSetting" ("sortOrder");

INSERT INTO "HomepageBannerMediaSetting" (
  "key",
  "locale",
  "eyebrow",
  "title",
  "subtitle",
  "imageUrl",
  "imageAlt",
  "ctaLabel",
  "ctaHref",
  "isActive",
  "sortOrder"
)
VALUES (
  'primary',
  NULL,
  'Golara flowers',
  'Fresh floral moments for every occasion',
  'Configure homepage banner copy, imagery, and calls to action from admin settings.',
  NULL,
  'Seasonal Golara floral arrangement',
  'Shop flowers',
  '/products',
  true,
  10
)
ON CONFLICT ("key", COALESCE("locale", '')) DO NOTHING;
