CREATE TABLE IF NOT EXISTS "StorefrontNavigationMenu" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "locale" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StorefrontNavigationMenuItem" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "menuId" TEXT NOT NULL,
  "parentId" TEXT,
  "label" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "locale" TEXT,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "opensInNewTab" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StorefrontNavigationMenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "StorefrontNavigationMenu"("id") ON DELETE CASCADE,
  CONSTRAINT "StorefrontNavigationMenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StorefrontNavigationMenuItem"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "StorefrontNavigationMenu_key_locale_key" ON "StorefrontNavigationMenu" ("key", COALESCE("locale", ''));
CREATE INDEX IF NOT EXISTS "StorefrontNavigationMenu_isActive_idx" ON "StorefrontNavigationMenu" ("isActive");
CREATE INDEX IF NOT EXISTS "StorefrontNavigationMenuItem_menuId_sortOrder_idx" ON "StorefrontNavigationMenuItem" ("menuId", "sortOrder");
CREATE INDEX IF NOT EXISTS "StorefrontNavigationMenuItem_parentId_sortOrder_idx" ON "StorefrontNavigationMenuItem" ("parentId", "sortOrder");
CREATE INDEX IF NOT EXISTS "StorefrontNavigationMenuItem_locale_isVisible_idx" ON "StorefrontNavigationMenuItem" ("locale", "isVisible");

WITH primary_menu AS (
  INSERT INTO "StorefrontNavigationMenu" ("key", "label", "locale", "isActive")
  VALUES ('primary', 'Primary navigation', NULL, true)
  ON CONFLICT ("key", COALESCE("locale", '')) DO UPDATE SET "label" = EXCLUDED."label"
  RETURNING "id"
)
INSERT INTO "StorefrontNavigationMenuItem" ("menuId", "label", "href", "sortOrder")
SELECT "id", 'Catalog', '/products', 10 FROM primary_menu
UNION ALL SELECT "id", 'Occasions', '/#occasions', 20 FROM primary_menu
UNION ALL SELECT "id", 'Available today', '/categories/available-today', 30 FROM primary_menu
UNION ALL SELECT "id", 'Best sellers', '/#best-sellers', 40 FROM primary_menu
ON CONFLICT DO NOTHING;
