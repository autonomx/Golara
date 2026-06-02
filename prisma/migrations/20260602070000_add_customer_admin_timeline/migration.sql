CREATE TABLE IF NOT EXISTS "CustomerAdminTimelineEvent" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'staff_note',
  "title" TEXT NOT NULL,
  "note" TEXT,
  "actorType" TEXT NOT NULL DEFAULT 'password',
  "actorLabel" TEXT NOT NULL DEFAULT 'Admin',
  "actorEmail" TEXT,
  "actorRole" TEXT NOT NULL DEFAULT 'owner',
  "actorProvider" TEXT NOT NULL DEFAULT 'password',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CustomerAdminTimelineEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CustomerAdminTimelineEvent_customerId_createdAt_idx" ON "CustomerAdminTimelineEvent"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "CustomerAdminTimelineEvent_type_createdAt_idx" ON "CustomerAdminTimelineEvent"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "CustomerAdminTimelineEvent_actorEmail_createdAt_idx" ON "CustomerAdminTimelineEvent"("actorEmail", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CustomerAdminTimelineEvent_customerId_fkey'
  ) THEN
    ALTER TABLE "CustomerAdminTimelineEvent"
      ADD CONSTRAINT "CustomerAdminTimelineEvent_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
