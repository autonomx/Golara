import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY,
  INTEGRATION_APP_CATEGORIES,
  INTEGRATION_APP_STATUSES,
  buildIntegrationAppRegistrySummary,
  normalizeIntegrationAppCategory,
  normalizeIntegrationAppKey,
  normalizeIntegrationAppRegistryInput,
  normalizeIntegrationAppStatus,
  normalizeIntegrationPermissionList,
  normalizeRequiredEnvVars
} from '../../lib/settings/integration-app-registry';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runIntegrationAppRegistryTests() {
  const migration = source('prisma/migrations/20260603100000_add_integration_app_registry/migration.sql');
  const service = source('lib/settings/integration-app-registry.ts');
  const panel = source('components/admin/AdminIntegrationAppRegistryPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "IntegrationAppRegistry"/);
  assert.match(migration, /"category" TEXT NOT NULL DEFAULT 'custom'/);
  assert.match(migration, /"status" TEXT NOT NULL DEFAULT 'planned'/);
  assert.match(migration, /"permissions" JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
  assert.match(migration, /"requiredEnvVars" JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
  assert.match(migration, /IntegrationAppRegistry_key_key/);
  assert.match(migration, /IntegrationAppRegistry_webhookConfigurationKey_idx/);
  assert.match(migration, /'default-webhook-app'/);

  assert.deepEqual(INTEGRATION_APP_CATEGORIES, ['webhook', 'payment', 'notification', 'shipping', 'analytics', 'cms', 'custom']);
  assert.deepEqual(INTEGRATION_APP_STATUSES, ['planned', 'configured', 'active', 'disabled', 'needs_attention']);
  assert.equal(DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.key, 'default-webhook-app');
  assert.equal(DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.category, 'webhook');
  assert.equal(DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY.status, 'planned');

  assert.match(service, /export type IntegrationAppRegistryEntry/);
  assert.match(service, /normalizeIntegrationAppKey/);
  assert.match(service, /normalizeIntegrationAppCategory/);
  assert.match(service, /normalizeIntegrationAppStatus/);
  assert.match(service, /normalizeIntegrationPermissionList/);
  assert.match(service, /normalizeRequiredEnvVars/);
  assert.match(service, /buildIntegrationAppRegistrySummary/);
  assert.match(service, /integrationAppRegistryService = \{/);
  assert.match(service, /FROM "IntegrationAppRegistry"/);
  assert.match(service, /INSERT INTO "IntegrationAppRegistry"/);
  assert.match(service, /action: 'settings\.integration_app_registry\.update'/);

  assert.equal(normalizeIntegrationAppKey(' Stripe Checkout! '), 'stripe-checkout');
  assert.equal(normalizeIntegrationAppCategory('Payment'), 'payment');
  assert.equal(normalizeIntegrationAppCategory('unknown'), 'webhook');
  assert.equal(normalizeIntegrationAppStatus('Needs Attention'), 'needs_attention');
  assert.equal(normalizeIntegrationAppStatus('unknown'), 'planned');
  assert.deepEqual(normalizeIntegrationPermissionList(' Webhooks Read\nwebhooks:write\nwebhooks:write '), ['webhooks:write']);
  assert.deepEqual(normalizeRequiredEnvVars(' stripe secret key\nSTRIPE_SECRET_KEY '), ['STRIPE_SECRET_KEY']);

  const normalized = normalizeIntegrationAppRegistryInput({
    key: ' Stripe Checkout! ',
    label: '  Stripe checkout  ',
    description: '  Card payments  ',
    category: 'Payment',
    provider: ' Stripe ',
    status: 'Configured',
    homepageUrl: 'https://stripe.com#docs',
    docsUrl: 'https://docs.stripe.com/payments',
    webhookConfigurationKey: ' Stripe Webhook ',
    permissions: ['payments:read', 'payments:write', 'payments:write'],
    requiredEnvVars: [' stripe secret key ', 'STRIPE_WEBHOOK_SECRET'],
    isInternal: false,
    isActive: true
  });

  assert.equal(normalized.key, 'stripe-checkout');
  assert.equal(normalized.label, 'Stripe checkout');
  assert.equal(normalized.description, 'Card payments');
  assert.equal(normalized.category, 'payment');
  assert.equal(normalized.provider, 'Stripe');
  assert.equal(normalized.status, 'configured');
  assert.equal(normalized.homepageUrl, 'https://stripe.com/');
  assert.equal(normalized.docsUrl, 'https://docs.stripe.com/payments');
  assert.equal(normalized.webhookConfigurationKey, 'stripe-webhook');
  assert.deepEqual(normalized.permissions, ['payments:read', 'payments:write']);
  assert.deepEqual(normalized.requiredEnvVars, ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']);

  const summary = buildIntegrationAppRegistrySummary([
    DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY,
    { ...DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY, id: 'active', key: 'active-payment', category: 'payment', status: 'active', isActive: true, isInternal: false },
    { ...DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY, id: 'attention', key: 'attention-app', category: 'custom', status: 'needs_attention', isActive: false, isInternal: true }
  ]);
  assert.equal(summary.total, 3);
  assert.equal(summary.active, 1);
  assert.equal(summary.internal, 2);
  assert.equal(summary.needsAttention, 1);
  assert.equal(summary.byCategory.webhook, 1);
  assert.equal(summary.byCategory.payment, 1);
  assert.equal(summary.byCategory.custom, 1);

  assert.match(panel, /export function AdminIntegrationAppRegistryPanel/);
  assert.match(panel, /Integration app registry/);
  assert.match(panel, /updateIntegrationAppRegistryAction/);
  assert.match(panel, /name="category"/);
  assert.match(panel, /name="requiredEnvVars"/);
  assert.match(panel, /Save integration app/);

  assert.match(fulfillmentPanel, /integrationAppRegistryService\.summary\(\)/);
  assert.match(fulfillmentPanel, /AdminIntegrationAppRegistryPanel/);

  assert.match(actions, /updateIntegrationAppRegistryAction/);
  assert.match(actions, /integrationAppRegistryService\.update/);
  assert.match(actions, /integration-app-registry-updated/);

  assert.match(roadmap, /- \[x\] Add integration\/app registry\./);

  console.log('integration-app-registry.test.ts passed');
}
