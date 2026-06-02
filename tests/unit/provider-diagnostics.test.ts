import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_API_TOKEN_CREDENTIAL } from '../../lib/settings/api-token-management';
import { DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY } from '../../lib/settings/integration-app-registry';
import { DEFAULT_NOTIFICATION_PROVIDER_SETTING, buildNotificationProviderReadinessSummary } from '../../lib/settings/notification-provider-settings';
import { DEFAULT_PAYMENT_PROVIDER_SETTING, buildPaymentProviderReadinessSummary } from '../../lib/settings/payment-provider-settings';
import {
  buildApiTokenDiagnosticCard,
  buildIntegrationRegistryDiagnosticCard,
  buildNotificationProviderDiagnosticCard,
  buildPaymentProviderDiagnosticCard,
  buildProviderDiagnosticsSummary,
  buildWebhookProviderDiagnosticCard
} from '../../lib/settings/provider-diagnostics';
import { DEFAULT_WEBHOOK_CONFIGURATION, buildWebhookReadinessSummary } from '../../lib/settings/webhook-configuration';
import { buildWebhookEventLogSummary } from '../../lib/settings/webhook-event-log';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runProviderDiagnosticsTests() {
  const service = source('lib/settings/provider-diagnostics.ts');
  const panel = source('components/admin/AdminProviderDiagnosticsPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(service, /export type ProviderDiagnosticStatus/);
  assert.match(service, /buildPaymentProviderDiagnosticCard/);
  assert.match(service, /buildNotificationProviderDiagnosticCard/);
  assert.match(service, /buildWebhookProviderDiagnosticCard/);
  assert.match(service, /buildIntegrationRegistryDiagnosticCard/);
  assert.match(service, /buildApiTokenDiagnosticCard/);
  assert.match(service, /buildProviderDiagnosticsSummary/);
  assert.match(service, /providerDiagnosticsService = \{/);
  assert.match(service, /paymentProviderSettingsService\.list\(\)/);
  assert.match(service, /notificationProviderSettingsService\.list\(\)/);
  assert.match(service, /webhookConfigurationService\.list\(\)/);
  assert.match(service, /integrationAppRegistryService\.summary\(\)/);
  assert.match(service, /apiTokenManagementService\.summary\(\)/);

  const paymentReady = buildPaymentProviderDiagnosticCard(buildPaymentProviderReadinessSummary(DEFAULT_PAYMENT_PROVIDER_SETTING, {}));
  assert.equal(paymentReady.category, 'payment');
  assert.equal(paymentReady.status, 'ready');
  assert.equal(paymentReady.blockers, 0);

  const notificationWarning = buildNotificationProviderDiagnosticCard(buildNotificationProviderReadinessSummary(DEFAULT_NOTIFICATION_PROVIDER_SETTING, {}));
  assert.equal(notificationWarning.category, 'notification');
  assert.equal(notificationWarning.status, 'needs_attention');
  assert.equal(notificationWarning.warnings, 1);

  const webhookInactive = buildWebhookProviderDiagnosticCard(buildWebhookReadinessSummary(DEFAULT_WEBHOOK_CONFIGURATION, {}), buildWebhookEventLogSummary([]));
  assert.equal(webhookInactive.category, 'webhook');
  assert.equal(webhookInactive.status, 'inactive');
  assert.equal(webhookInactive.requiredEnvironmentVariables[0], 'GOLARA_WEBHOOK_SECRET');

  const integrationReady = buildIntegrationRegistryDiagnosticCard({
    total: 1,
    active: 0,
    internal: 1,
    needsAttention: 0,
    byCategory: { webhook: 1, payment: 0, notification: 0, shipping: 0, analytics: 0, cms: 0, custom: 0 },
    entries: [DEFAULT_INTEGRATION_APP_REGISTRY_ENTRY]
  });
  assert.equal(integrationReady.status, 'ready');

  const tokenAttention = buildApiTokenDiagnosticCard({
    total: 1,
    active: 0,
    revoked: 1,
    expired: 0,
    expiringSoon: 0,
    entries: [{ ...DEFAULT_API_TOKEN_CREDENTIAL, isRevoked: true }]
  });
  assert.equal(tokenAttention.status, 'needs_attention');
  assert.equal(tokenAttention.warnings, 1);

  const summary = buildProviderDiagnosticsSummary([paymentReady, notificationWarning, webhookInactive, integrationReady, tokenAttention]);
  assert.equal(summary.total, 5);
  assert.equal(summary.ready, false);
  assert.equal(summary.readyCount, 2);
  assert.equal(summary.needsAttention, 2);
  assert.equal(summary.inactive, 1);
  assert.equal(summary.notConfigured, 0);

  assert.match(panel, /export function AdminProviderDiagnosticsPanel/);
  assert.match(panel, /Provider diagnostics/);
  assert.match(panel, /Unified readiness view/);
  assert.match(panel, /requiredEnvironmentVariables/);

  assert.match(fulfillmentPanel, /providerDiagnosticsService\.summary\(\)/);
  assert.match(fulfillmentPanel, /AdminProviderDiagnosticsPanel/);

  assert.match(roadmap, /- \[x\] Add provider diagnostics pages\./);

  console.log('provider-diagnostics.test.ts passed');
}
