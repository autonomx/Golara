-- First-party storefront/site analytics event foundation.
-- Stores normalized operational analytics events without raw IP addresses, user agents,
-- emails, phone numbers, or customer names.
CREATE TABLE IF NOT EXISTS "SiteAnalyticsEvent" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "eventType" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "query" TEXT,
  "locale" TEXT,
  "productId" TEXT,
  "categoryId" TEXT,
  "searchTerm" TEXT,
  "anonymousSessionId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SiteAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_eventType_createdAt_idx" ON "SiteAnalyticsEvent"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_path_createdAt_idx" ON "SiteAnalyticsEvent"("path", "createdAt");
CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_locale_createdAt_idx" ON "SiteAnalyticsEvent"("locale", "createdAt");
CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_productId_createdAt_idx" ON "SiteAnalyticsEvent"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_categoryId_createdAt_idx" ON "SiteAnalyticsEvent"("categoryId", "createdAt");
CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_anonymousSessionId_createdAt_idx" ON "SiteAnalyticsEvent"("anonymousSessionId", "createdAt");
