-- Admin analytics scheduled-report storage foundation.
-- This creates the metadata table needed by a future owner-managed scheduled-report workflow.
-- The application does not write to this table yet; activation and delivery routes remain disabled.

CREATE TABLE "AdminAnalyticsScheduledReport" (
  "id" TEXT NOT NULL,
  "reportKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "cadence" TEXT NOT NULL,
  "rangeMode" TEXT NOT NULL,
  "rangeQuery" TEXT NOT NULL,
  "reportTypes" JSONB NOT NULL DEFAULT '["business", "site"]',
  "ownerApproved" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
  "deliveryChannel" TEXT,
  "lastDryRunAt" TIMESTAMP(3),
  "lastDryRunSummary" JSONB NOT NULL DEFAULT '{}',
  "createdByRole" TEXT NOT NULL DEFAULT 'owner',
  "createdByLabel" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAnalyticsScheduledReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminAnalyticsScheduledReport_reportKey_cadence_key"
  ON "AdminAnalyticsScheduledReport"("reportKey", "cadence");

CREATE INDEX "AdminAnalyticsScheduledReport_cadence_isActive_idx"
  ON "AdminAnalyticsScheduledReport"("cadence", "isActive");

CREATE INDEX "AdminAnalyticsScheduledReport_ownerApproved_isActive_idx"
  ON "AdminAnalyticsScheduledReport"("ownerApproved", "isActive");

CREATE INDEX "AdminAnalyticsScheduledReport_deliveryEnabled_isActive_idx"
  ON "AdminAnalyticsScheduledReport"("deliveryEnabled", "isActive");

CREATE INDEX "AdminAnalyticsScheduledReport_createdAt_idx"
  ON "AdminAnalyticsScheduledReport"("createdAt");
