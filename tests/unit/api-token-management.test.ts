import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_API_TOKEN_CREDENTIAL,
  buildApiTokenManagementSummary,
  createApiTokenDigest,
  deriveApiTokenPrefix,
  normalizeApiTokenKey,
  normalizeApiTokenPrefix
} from '../../lib/settings/api-token-management';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runApiTokenManagementTests() {
  const migration = source('prisma/migrations/20260603110000_add_api_token_management/migration.sql');
  const service = source('lib/settings/api-token-management.ts');
  const panel = source('components/admin/AdminApiTokenManagementPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "ApiTokenCredential"/);
  assert.match(migration, /"tokenPrefix" TEXT/);
  assert.match(migration, /"tokenDigest" TEXT/);
  assert.match(migration, /"scopes" JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
  assert.match(migration, /"integrationAppKey" TEXT/);
  assert.match(migration, /ApiTokenCredential_tokenDigest_key/);
  assert.match(migration, /ApiTokenCredential_expiresAt_idx/);

  assert.equal(DEFAULT_API_TOKEN_CREDENTIAL.key, 'default-internal-api-token');
  assert.equal(DEFAULT_API_TOKEN_CREDENTIAL.tokenDigest, null);
  assert.equal(DEFAULT_API_TOKEN_CREDENTIAL.isActive, false);

  assert.match(service, /export type ApiTokenCredential/);
  assert.match(service, /normalizeApiTokenKey/);
  assert.match(service, /normalizeApiTokenPrefix/);
  assert.match(service, /createApiTokenDigest/);
  assert.match(service, /deriveApiTokenPrefix/);
  assert.match(service, /buildApiTokenManagementSummary/);
  assert.match(service, /apiTokenManagementService = \{/);
  assert.match(service, /FROM "ApiTokenCredential"/);
  assert.match(service, /INSERT INTO "ApiTokenCredential"/);
  assert.match(service, /action: 'settings\.api_token_management\.update'/);

  assert.equal(normalizeApiTokenKey(' Internal Key! '), 'internal-key');
  assert.equal(normalizeApiTokenPrefix(' Golara Live Key '), 'golara_live_key');
  assert.equal(deriveApiTokenPrefix('golara_live_sample_value'), 'golara_live');
  const digest = createApiTokenDigest('sample-value');
  assert.ok(digest);
  assert.equal(digest.length, 64);
  assert.equal(createApiTokenDigest(''), null);

  const now = new Date('2026-06-01T00:00:00.000Z');
  const summary = buildApiTokenManagementSummary([
    { ...DEFAULT_API_TOKEN_CREDENTIAL, id: 'active', key: 'active', isActive: true, isRevoked: false },
    { ...DEFAULT_API_TOKEN_CREDENTIAL, id: 'revoked', key: 'revoked', isActive: true, isRevoked: true },
    { ...DEFAULT_API_TOKEN_CREDENTIAL, id: 'expired', key: 'expired', expiresAt: new Date('2026-05-01T00:00:00.000Z') },
    { ...DEFAULT_API_TOKEN_CREDENTIAL, id: 'soon', key: 'soon', expiresAt: new Date('2026-06-10T00:00:00.000Z') }
  ], now);
  assert.equal(summary.total, 4);
  assert.equal(summary.active, 1);
  assert.equal(summary.revoked, 1);
  assert.equal(summary.expired, 1);
  assert.equal(summary.expiringSoon, 1);

  assert.match(panel, /export function AdminApiTokenManagementPanel/);
  assert.match(panel, /API token management/);
  assert.match(panel, /updateApiTokenManagementAction/);
  assert.match(panel, /Save token metadata/);

  assert.match(fulfillmentPanel, /apiTokenManagementService\.summary\(\)/);
  assert.match(fulfillmentPanel, /AdminApiTokenManagementPanel/);

  assert.match(actions, /updateApiTokenManagementAction/);
  assert.match(actions, /apiTokenManagementService\.update/);
  assert.match(actions, /api-token-management-updated/);

  assert.match(roadmap, /- \[x\] Add API token management if needed\./);

  console.log('api-token-management.test.ts passed');
}
