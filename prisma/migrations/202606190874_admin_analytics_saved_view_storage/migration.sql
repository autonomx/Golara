-- Admin analytics saved-view storage foundation.
-- This creates the metadata table needed by a future owner-managed saved-view workflow.
-- The application does not write to this table yet; save/update/remove routes remain disabled.

CREATE TABLE "AdminAnalyticsSavedView" (
  "id" TEXT NOT NULL,
  "viewKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "scope" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "rangeMode" TEXT NOT NULL,
  "rangeQuery" TEXT NOT NULL,
  "sectionAnchors" JSONB NOT NULL DEFAULT '[]',
  "ownerApproved" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdByRole" TEXT NOT NULL DEFAULT 'owner',
  "createdByLabel" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAnalyticsSavedView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminAnalyticsSavedView_viewKey_scope_key"
  ON "AdminAnalyticsSavedView"("viewKey", "scope");

CREATE INDEX "AdminAnalyticsSavedView_scope_isActive_idx"
  ON "AdminAnalyticsSavedView"("scope", "isActive");

CREATE INDEX "AdminAnalyticsSavedView_audience_scope_idx"
  ON "AdminAnalyticsSavedView"("audience", "scope");

CREATE INDEX "AdminAnalyticsSavedView_ownerApproved_isActive_idx"
  ON "AdminAnalyticsSavedView"("ownerApproved", "isActive");

CREATE INDEX "AdminAnalyticsSavedView_createdAt_idx"
  ON "AdminAnalyticsSavedView"("createdAt");
