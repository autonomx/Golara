import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_API_TOKEN_CREDENTIAL,
  buildApiTokenManagementSummary,
  createApiTokenDigest,
  deriveApiTokenPrefix,
  normalizeApiTokenCredentialInput,
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
  assert.match(migration, /'default-internal-api-token'/);
  assert.doesNotMatch(migration, /tokenValue/);

  assert.equal(DEFAULT_API_TOKEN_CREDENTIAL.key, 'default-internal-api-token');
  assert.equal(DEFAULT_API_TOKEN_CREDENTIAL.tokenDigest, null);
  assert.equal(DEFAULT_API_TOKEN_CREDENTIAL.isActive, false);

  assert.match(service, /export type ApiTokenCredential/);
  assert.match(service, /normalizeApiTokenKey/);
  assert.match(service, /normalizeApiTokenPrefix/);
  assert.match(service, /createApiTokenDigest/);
  assert.match(service, /deriveApiTokenPrefix/);
  assert.match(service, /normalizeApiTokenCredentialInput/);
  assert.match(service, /buildApiTokenManagementSummary/);
  assert.match(service, /apiTokenManagementService = \{/);
  assert.match(service, /FROM "ApiTokenCredential"/);
  assert.match(service, /INSERT INTO "ApiTokenCredential"/);
  assert.match(service, /action: 'settings\.api_token_management\.update'/);

  assert.equal(normalizeApiTokenKey(' Internal Token! '), 'internal-token');
  assert.equal(normalizeApiTokenPrefix(' Golara Live Token '), 'golara_live_token');
  assert.equal(deriveApiTokenPrefix('golara_live_secret_value'), 'golara_live');
  assert.equal(createApiTokenDigest(' secret ').length, 64);
  assert.equal(createApiTokenDigest(''), null);

  const normalized = normalizeApiTokenCredentialInput({
    key: ' Internal Token! ',
    label: '  Internal token  ',
    description: '  For automation  ',
    tokenValue: 'golara_live_secret_value',
    tokenPrefix: 'ignored fallback',
    scopes: ['Admin Read', 'webhooks:read', 'webhooks:read'],
    integrationAppKey: ' Default Webhook App ',
    expiresAt: '2026-07-01T00:00:00.000Z',
    isRevoked: false,
    isActive: true
  });

  assert.equal(normalized.key, 'internal-token');
  assert.equal(normalized.label, 'Internal token');
  assert.equal(normalized.description, 'For automation');
  assert.equal(normalized.tokenPrefix, 'golara_live');
  assert.equal(normalized.tokenDigest?.length, 64);
  assert.deepEqual(normalized.scopes, ['webhooks:read']);
  assert.equal(normalized.integrationAppKey, 'default-webhook-app');
  assert.equal(normalized.expiresAt?.toISOString(), '2026-07-01T00:00:00.000Z');

  const now = new Date('2026-06-01T00:00:00.000Z');
  const summary = buildApiTokenManagementSummary([
    { ...DEFAULT_API_TOKEN_CREDENTIAL, id: 'active', key: 'active', isActive: true, isRevoked: false },
    { ...DEFAULT_API_TOKEN_CREDENTIAL, id: 'revoked', key: 'revoked', isActive: true, isRevoked: true },
    { ...DEFAULT_API_TOKEN_CREDENTIAL, id: 'expired', key: 'expired', expiresAt: new Date('2026-05-01T00:00:00.000Z') },
    { ...DEFAULT_API_TOKEN_CREDENTIAL, id: 'soon', key: 'soon', expiresAt: new Date('2026-06-10T00:00:00.000Z') }
  ], now);
  assert.equal(summary.total, 4);
  assert.equal(summary.active, 3);
  assert.equal(summary.revoked, 1);
  assert.equal(summary.expired, 1);
  assert.equal(summary.expiringSoon, 1);

  assert.match(panel, /export function AdminApiTokenManagementPanel/);
  assert.match(panel, /API token management/);
  assert.match(panel, /updateApiTokenManagementAction/);
  assert.match(panel, /Raw token values are accepted only to compute a digest/);
  assert.match(panel, /name="tokenValue" type="password"/);
  assert.match(panel, /Save token metadata/);

  assert.match(fulfillmentPanel, /apiTokenManagementService\.summary\(\)/);
  assert.match(fulfillmentPanel, /AdminApiTokenManagementPanel/);

  assert.match(actions, /updateApiTokenManagementAction/);
  assert.match(actions, /apiTokenManagementService\.update/);
  assert.match(actions, /api-token-management-updated/);

  assert.match(roadmap, /- \[x\] Add API token management if needed\./);

  console.log('api-token-management.test.ts passed');
}
