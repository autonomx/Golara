CREATE TABLE IF NOT EXISTS "AdminPermissionGroup" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "role" TEXT NOT NULL DEFAULT 'staff',
  "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AdminStaffAccount" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "provider" TEXT NOT NULL DEFAULT 'password',
  "providerAccountId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "email" TEXT,
  "role" TEXT NOT NULL DEFAULT 'staff',
  "permissionGroupKey" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminStaffAccount_permissionGroupKey_fkey" FOREIGN KEY ("permissionGroupKey") REFERENCES "AdminPermissionGroup"("key") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminPermissionGroup_key_key" ON "AdminPermissionGroup" ("key");
CREATE INDEX IF NOT EXISTS "AdminPermissionGroup_role_idx" ON "AdminPermissionGroup" ("role");
CREATE INDEX IF NOT EXISTS "AdminPermissionGroup_isActive_idx" ON "AdminPermissionGroup" ("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminPermissionGroup_single_default_idx" ON "AdminPermissionGroup" ("isDefault") WHERE "isDefault" = true;

CREATE UNIQUE INDEX IF NOT EXISTS "AdminStaffAccount_provider_account_key" ON "AdminStaffAccount" ("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "AdminStaffAccount_role_idx" ON "AdminStaffAccount" ("role");
CREATE INDEX IF NOT EXISTS "AdminStaffAccount_email_idx" ON "AdminStaffAccount" ("email");
CREATE INDEX IF NOT EXISTS "AdminStaffAccount_permissionGroupKey_idx" ON "AdminStaffAccount" ("permissionGroupKey");
CREATE INDEX IF NOT EXISTS "AdminStaffAccount_isActive_idx" ON "AdminStaffAccount" ("isActive");

INSERT INTO "AdminPermissionGroup" (
  "key",
  "label",
  "description",
  "role",
  "permissions",
  "isDefault",
  "isActive"
)
VALUES (
  'staff-operations',
  'Staff operations',
  'Default staff permission group for inquiry, order, customer, and fulfillment operations.',
  'staff',
  '["inquiries:read", "inquiries:write", "orders:read", "orders:write", "customers:read", "fulfillment:write"]'::jsonb,
  true,
  true
)
ON CONFLICT ("key") DO NOTHING;
