CREATE TABLE IF NOT EXISTS "ApiTokenCredential" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "tokenPrefix" TEXT,
  "tokenDigest" TEXT,
  "scopes" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "integrationAppKey" TEXT,
  "expiresAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "isRevoked" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "ApiTokenCredential_key_key" ON "ApiTokenCredential" ("key");
CREATE UNIQUE INDEX IF NOT EXISTS "ApiTokenCredential_tokenDigest_key" ON "ApiTokenCredential" ("tokenDigest") WHERE "tokenDigest" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ApiTokenCredential_integrationAppKey_idx" ON "ApiTokenCredential" ("integrationAppKey") WHERE "integrationAppKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ApiTokenCredential_isActive_idx" ON "ApiTokenCredential" ("isActive");
CREATE INDEX IF NOT EXISTS "ApiTokenCredential_isRevoked_idx" ON "ApiTokenCredential" ("isRevoked");
CREATE INDEX IF NOT EXISTS "ApiTokenCredential_expiresAt_idx" ON "ApiTokenCredential" ("expiresAt") WHERE "expiresAt" IS NOT NULL;

INSERT INTO "ApiTokenCredential" (
  "key",
  "label",
  "description",
  "tokenPrefix",
  "tokenDigest",
  "scopes",
  "integrationAppKey",
  "expiresAt",
  "isRevoked",
  "isActive"
)
VALUES (
  'default-internal-api-token',
  'Default internal API token placeholder',
  'Metadata-only placeholder for future API token issuance. Secret token values are never stored in admin settings.',
  'golara_live',
  NULL,
  '["admin:read", "webhooks:read"]'::jsonb,
  'default-webhook-app',
  NULL,
  false,
  false
)
ON CONFLICT ("key") DO NOTHING;
