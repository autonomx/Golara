-- Add import/export job tracking for admin operations.
CREATE TABLE IF NOT EXISTS "ImportExportJob" (
  "id" TEXT NOT NULL DEFAULT ('import_export_job_' || replace(gen_random_uuid()::text, '-', '')),
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'export',
  "target" TEXT NOT NULL DEFAULT 'products',
  "status" TEXT NOT NULL DEFAULT 'queued',
  "requestedBy" TEXT,
  "sourceFilename" TEXT,
  "sourceMimeType" TEXT,
  "inputDigest" TEXT,
  "outputUrl" TEXT,
  "outputDigest" TEXT,
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "processedRows" INTEGER NOT NULL DEFAULT 0,
  "failedRows" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportExportJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ImportExportJob_key_key"
  ON "ImportExportJob"("key");

CREATE INDEX IF NOT EXISTS "ImportExportJob_kind_target_idx"
  ON "ImportExportJob"("kind", "target");

CREATE INDEX IF NOT EXISTS "ImportExportJob_status_created_idx"
  ON "ImportExportJob"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "ImportExportJob_requestedBy_idx"
  ON "ImportExportJob"("requestedBy");
