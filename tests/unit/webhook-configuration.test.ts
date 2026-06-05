import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_WEBHOOK_CONFIGURATION,
  buildWebhookReadinessSummary,
  isWebhookTargetUrlValid,
  normalizeWebhookConfigurationInput,
  normalizeWebhookEvents,
  normalizeWebhookHeaderNames,
  normalizeWebhookKey,
  normalizeWebhookSecretEnvVar,
  normalizeWebhookTargetUrl
} from '../../lib/settings/webhook-configuration';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoPhase35RuntimeDeliverySurface(pageSource: string) {
  assert.equal(pageSource.includes('fetch('), false);
  assert.equal(pageSource.includes('setInterval('), false);
  assert.equal(pageSource.includes('setTimeout('), false);
  assert.equal(pageSource.includes('cron'), false);
  assert.equal(pageSource.includes('retryWebhookDeliveryAction'), false);
  assert.equal(pageSource.includes('cancelWebhookDeliveryAction'), false);
  assert.equal(pageSource.includes('forceSendWebhook'), false);
}

export async function runWebhookConfigurationTests() {
  const migration = source('prisma/migrations/20260603080000_add_webhook_configuration/migration.sql');
  const service = source('lib/settings/webhook-configuration.ts');
  const panel = source('components/admin/AdminWebhookConfigurationPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');
  const phase35Kickoff = source('docs/production-roadmap-phase35-durable-outbound-webhook-worker.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "WebhookConfiguration"/);
  assert.match(migration, /"targetUrl" TEXT NOT NULL/);
  assert.match(migration, /"events" JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
  assert.match(migration, /"secretEnvVar" TEXT/);
  assert.match(migration, /"headerNames" JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
  assert.match(migration, /WebhookConfiguration_key_key/);
  assert.match(migration, /WebhookConfiguration_single_default_idx/);
  assert.match(migration, /'default-webhook-configuration'/);

  assert.match(service, /export type WebhookConfiguration/);
  assert.match(service, /DEFAULT_WEBHOOK_CONFIGURATION/);
  assert.match(service, /normalizeWebhookKey/);
  assert.match(service, /normalizeWebhookTargetUrl/);
  assert.match(service, /normalizeWebhookEvents/);
  assert.match(service, /normalizeWebhookHeaderNames/);
  assert.match(service, /normalizeWebhookSecretEnvVar/);
  assert.match(service, /buildWebhookReadinessSummary/);
  assert.match(service, /webhookConfigurationService = \{/);
  assert.match(service, /FROM "WebhookConfiguration"/);
  assert.match(service, /INSERT INTO "WebhookConfiguration"/);
  assert.match(service, /action: 'settings\.webhook_configuration\.update'/);

  assert.equal(DEFAULT_WEBHOOK_CONFIGURATION.key, 'default-webhook-configuration');
  assert.equal(DEFAULT_WEBHOOK_CONFIGURATION.isDefault, true);
  assert.equal(DEFAULT_WEBHOOK_CONFIGURATION.isActive, false);
  assert.deepEqual(DEFAULT_WEBHOOK_CONFIGURATION.events, ['order.created', 'order.updated']);

  assert.equal(normalizeWebhookKey('  Owner Webhook! '), 'owner-webhook');
  assert.equal(normalizeWebhookTargetUrl('https://example.com/webhooks/golara#secret'), 'https://example.com/webhooks/golara');
  assert.equal(normalizeWebhookTargetUrl('ftp://example.com/file'), DEFAULT_WEBHOOK_CONFIGURATION.targetUrl);
  assert.equal(isWebhookTargetUrlValid('https://example.com/webhooks/golara'), true);
  assert.equal(isWebhookTargetUrlValid('http://localhost:3000/hooks'), true);
  assert.equal(isWebhookTargetUrlValid('http://example.com/hooks'), false);
  assert.deepEqual(normalizeWebhookEvents(' order.updated\nOrder.Created\ninvalid\norder.updated '), ['order.created', 'order.updated']);
  assert.deepEqual(normalizeWebhookHeaderNames(' X-Golara-Signature\nBad Header\nx-golara-signature '), ['x-golara-signature']);
  assert.equal(normalizeWebhookSecretEnvVar(' golara webhook secret '), 'GOLARA_WEBHOOK_SECRET');

  const normalized = normalizeWebhookConfigurationInput({
    key: ' Owner Webhook! ',
    label: '  Owner webhook  ',
    description: '  Sends order events  ',
    targetUrl: 'https://example.com/webhooks/golara#ignore',
    events: ['Order.Created', 'order.updated', 'order.created'],
    secretEnvVar: ' golara webhook secret ',
    headerNames: ['X-Golara-Signature', 'x-golara-signature'],
    isDefault: true,
    isActive: true
  });

  assert.equal(normalized.key, 'owner-webhook');
  assert.equal(normalized.label, 'Owner webhook');
  assert.equal(normalized.description, 'Sends order events');
  assert.equal(normalized.targetUrl, 'https://example.com/webhooks/golara');
  assert.deepEqual(normalized.events, ['order.created', 'order.updated']);
  assert.equal(normalized.secretEnvVar, 'GOLARA_WEBHOOK_SECRET');
  assert.deepEqual(normalized.headerNames, ['x-golara-signature']);

  const readySummary = buildWebhookReadinessSummary({
    ...DEFAULT_WEBHOOK_CONFIGURATION,
    targetUrl: 'https://example.com/webhooks/golara',
    isActive: true
  }, {
    GOLARA_WEBHOOK_SECRET: 'secret'
  });
  assert.equal(readySummary.ready, true);
  assert.deepEqual(readySummary.blockers, []);

  const blockedSummary = buildWebhookReadinessSummary({
    ...DEFAULT_WEBHOOK_CONFIGURATION,
    targetUrl: 'http://example.com/webhooks/golara',
    events: [],
    isActive: true
  }, {});
  assert.equal(blockedSummary.ready, false);
  assert.deepEqual(blockedSummary.blockers.map((issue) => issue.code), ['webhook_target_url_invalid', 'webhook_events_missing']);
  assert.deepEqual(blockedSummary.warnings.map((issue) => issue.code), ['webhook_secret_env_missing']);

  const inactiveSummary = buildWebhookReadinessSummary(DEFAULT_WEBHOOK_CONFIGURATION, {});
  assert.equal(inactiveSummary.ready, false);
  assert.deepEqual(inactiveSummary.warnings.map((issue) => issue.code), ['webhook_secret_env_missing', 'webhook_configuration_inactive']);

  assert.match(panel, /export function AdminWebhookConfigurationPanel/);
  assert.match(panel, /updateWebhookConfigurationAction/);
  assert.match(panel, /Webhook configuration/);
  assert.match(panel, /name="targetUrl"/);
  assert.match(panel, /name="events"/);
  assert.match(panel, /name="secretEnvVar"/);
  assert.match(panel, /Save webhook configuration/);

  assert.match(fulfillmentPanel, /webhookConfigurationService\.list\(\)/);
  assert.match(fulfillmentPanel, /AdminWebhookConfigurationPanel/);

  assert.match(actions, /updateWebhookConfigurationAction/);
  assert.match(actions, /webhookConfigurationService\.update/);
  assert.match(actions, /webhook-configuration-updated/);

  assert.match(roadmap, /- \[x\] Add webhook configuration\./);

  assert.match(phase35Kickoff, /Phase 35 Durable Outbound Webhook Worker/);
  assert.match(phase35Kickoff, /inert outbound delivery planner/);
  assert.match(phase35Kickoff, /Planned delivery record shape/);
  assert.match(phase35Kickoff, /Planned lifecycle states/);
  assert.match(phase35Kickoff, /Retry and backoff planning/);
  assert.match(phase35Kickoff, /Signing expectations/);
  assert.match(phase35Kickoff, /Admin visibility expectations/);
  assert.match(phase35Kickoff, /must not include a dispatcher, queue consumer, retry loop, signing runtime, admin retry\/cancel control, or production-ready outbound delivery claim/);
  assertNoPhase35RuntimeDeliverySurface(phase35Kickoff);

  console.log('webhook-configuration.test.ts passed');
}
