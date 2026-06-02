-- Add dashboard extension mount points for internal tools.
CREATE TABLE IF NOT EXISTS "DashboardExtensionMountPoint" (
  "id" TEXT NOT NULL DEFAULT ('dashboard_extension_mount_point_' || replace(gen_random_uuid()::text, '-', '')),
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "mountLocation" TEXT NOT NULL DEFAULT 'operations_home',
  "integrationAppKey" TEXT,
  "requiredRoles" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "requiredPermissions" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isInternal" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DashboardExtensionMountPoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DashboardExtensionMountPoint_key_key"
  ON "DashboardExtensionMountPoint"("key");

CREATE INDEX IF NOT EXISTS "DashboardExtensionMountPoint_mountLocation_idx"
  ON "DashboardExtensionMountPoint"("mountLocation");

CREATE INDEX IF NOT EXISTS "DashboardExtensionMountPoint_integrationAppKey_idx"
  ON "DashboardExtensionMountPoint"("integrationAppKey");

CREATE INDEX IF NOT EXISTS "DashboardExtensionMountPoint_active_sort_idx"
  ON "DashboardExtensionMountPoint"("isActive", "mountLocation", "sortOrder");
