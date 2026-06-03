-- Product/PIM schema parity foundation.
-- This migration backfills the ProductVariant and related catalog tables expected by later migrations.

CREATE TABLE IF NOT EXISTS "ProductType" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductType_slug_key" ON "ProductType"("slug");
CREATE INDEX IF NOT EXISTS "ProductType_isActive_sortOrder_idx" ON "ProductType"("isActive", "sortOrder");

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalPath" TEXT,
  ADD COLUMN IF NOT EXISTS "seoIndex" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "productTypeId" TEXT;

CREATE INDEX IF NOT EXISTS "Product_productTypeId_idx" ON "Product"("productTypeId");
CREATE INDEX IF NOT EXISTS "Product_isActive_bestSeller_idx" ON "Product"("isActive", "bestSeller");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Product_productTypeId_fkey'
  ) THEN
    ALTER TABLE "Product"
      ADD CONSTRAINT "Product_productTypeId_fkey"
      FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "imageUrl" TEXT,
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_isActive_idx" ON "ProductVariant"("productId", "isActive");
CREATE INDEX IF NOT EXISTS "ProductVariant_sku_idx" ON "ProductVariant"("sku");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariant_productId_fkey'
  ) THEN
    ALTER TABLE "ProductVariant"
      ADD CONSTRAINT "ProductVariant_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ProductAttribute" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "inputType" TEXT NOT NULL DEFAULT 'text',
  "appliesTo" TEXT NOT NULL DEFAULT 'product',
  "unit" TEXT,
  "options" JSONB,
  "isFilterable" BOOLEAN NOT NULL DEFAULT false,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductAttribute_slug_key" ON "ProductAttribute"("slug");
CREATE INDEX IF NOT EXISTS "ProductAttribute_appliesTo_isActive_sortOrder_idx" ON "ProductAttribute"("appliesTo", "isActive", "sortOrder");

CREATE TABLE IF NOT EXISTS "ProductAttributeValue" (
  "id" TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "productId" TEXT,
  "variantId" TEXT,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductAttributeValue_attributeId_productId_key" ON "ProductAttributeValue"("attributeId", "productId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductAttributeValue_attributeId_variantId_key" ON "ProductAttributeValue"("attributeId", "variantId");
CREATE INDEX IF NOT EXISTS "ProductAttributeValue_productId_idx" ON "ProductAttributeValue"("productId");
CREATE INDEX IF NOT EXISTS "ProductAttributeValue_variantId_idx" ON "ProductAttributeValue"("variantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAttributeValue_attributeId_fkey'
  ) THEN
    ALTER TABLE "ProductAttributeValue"
      ADD CONSTRAINT "ProductAttributeValue_attributeId_fkey"
      FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAttributeValue_productId_fkey'
  ) THEN
    ALTER TABLE "ProductAttributeValue"
      ADD CONSTRAINT "ProductAttributeValue_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAttributeValue_variantId_fkey'
  ) THEN
    ALTER TABLE "ProductAttributeValue"
      ADD CONSTRAINT "ProductAttributeValue_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Collection" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Collection_slug_key" ON "Collection"("slug");
CREATE INDEX IF NOT EXISTS "Collection_isActive_sortOrder_idx" ON "Collection"("isActive", "sortOrder");

CREATE TABLE IF NOT EXISTS "ProductCollection" (
  "productId" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductCollection_pkey" PRIMARY KEY ("productId", "collectionId")
);

CREATE INDEX IF NOT EXISTS "ProductCollection_collectionId_idx" ON "ProductCollection"("collectionId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductCollection_productId_fkey'
  ) THEN
    ALTER TABLE "ProductCollection"
      ADD CONSTRAINT "ProductCollection_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductCollection_collectionId_fkey'
  ) THEN
    ALTER TABLE "ProductCollection"
      ADD CONSTRAINT "ProductCollection_collectionId_fkey"
      FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ProductTranslation" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageAlt" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductTranslation"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "imageAlt" TEXT,
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true;

UPDATE "ProductTranslation" SET "title" = '' WHERE "title" IS NULL;
ALTER TABLE "ProductTranslation" ALTER COLUMN "title" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");
CREATE INDEX IF NOT EXISTS "ProductTranslation_locale_isPublished_idx" ON "ProductTranslation"("locale", "isPublished");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductTranslation_productId_fkey'
  ) THEN
    ALTER TABLE "ProductTranslation"
      ADD CONSTRAINT "ProductTranslation_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CategoryTranslation" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "eyebrow" TEXT,
  "description" TEXT,
  "imageAlt" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CategoryTranslation"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "eyebrow" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "imageAlt" TEXT,
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true;

UPDATE "CategoryTranslation" SET "title" = '' WHERE "title" IS NULL;
ALTER TABLE "CategoryTranslation" ALTER COLUMN "title" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale");
CREATE INDEX IF NOT EXISTS "CategoryTranslation_locale_isPublished_idx" ON "CategoryTranslation"("locale", "isPublished");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CategoryTranslation_categoryId_fkey'
  ) THEN
    ALTER TABLE "CategoryTranslation"
      ADD CONSTRAINT "CategoryTranslation_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "HomepageSectionTranslation" (
  "id" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT,
  "subtitle" TEXT,
  "body" TEXT,
  "payload" JSONB,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomepageSectionTranslation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "HomepageSectionTranslation"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "subtitle" TEXT,
  ADD COLUMN IF NOT EXISTS "body" TEXT,
  ADD COLUMN IF NOT EXISTS "payload" JSONB,
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "HomepageSectionTranslation_sectionId_locale_key" ON "HomepageSectionTranslation"("sectionId", "locale");
CREATE INDEX IF NOT EXISTS "HomepageSectionTranslation_locale_isPublished_idx" ON "HomepageSectionTranslation"("locale", "isPublished");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'HomepageSectionTranslation_sectionId_fkey'
  ) THEN
    ALTER TABLE "HomepageSectionTranslation"
      ADD CONSTRAINT "HomepageSectionTranslation_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "HomepageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
