import 'server-only';

import { apiTokenManagementService, type ApiTokenManagementSummary } from '@/lib/settings/api-token-management';
import { integrationAppRegistryService, type IntegrationAppRegistrySummary } from '@/lib/settings/integration-app-registry';
import { buildNotificationProviderReadinessSummary, notificationProviderSettingsService, type NotificationProviderReadinessSummary } from '@/lib/settings/notification-provider-settings';
import { buildPaymentProviderReadinessSummary, paymentProviderSettingsService, type PaymentProviderReadinessSummary } from '@/lib/settings/payment-provider-settings';
import { buildWebhookReadinessSummary, webhookConfigurationService, type WebhookReadinessSummary } from '@/lib/settings/webhook-configuration';
import { webhookEventLogService, type WebhookEventLogSummary } from '@/lib/settings/webhook-event-log';

export type ProviderDiagnosticStatus = 'ready' | 'needs_attention' | 'inactive' | 'not_configured';

export type ProviderDiagnosticCard = {
  key: string;
  label: string;
  category: 'payment' | 'notification' | 'webhook' | 'integration' | 'token';
  status: ProviderDiagnosticStatus;
  blockers: number;
  warnings: number;
  requiredEnvironmentVariables: string[];
  summary: string;
};

export type ProviderDiagnosticsSummary = {
  ready: boolean;
  total: number;
  readyCount: number;
  needsAttention: number;
  inactive: number;
  notConfigured: number;
  cards: ProviderDiagnosticCard[];
};

function statusFromReadiness(ready: boolean, active: boolean, blockers: number, warnings: number): ProviderDiagnosticStatus {
  if (!active) return 'inactive';
  if (ready && blockers === 0) return 'ready';
  if (blockers > 0 || warnings > 0) return 'needs_attention';
  return 'not_configured';
}

export function buildPaymentProviderDiagnosticCard(readiness: PaymentProviderReadinessSummary): ProviderDiagnosticCard {
  const blockers = readiness.blockers.length;
  const warnings = readiness.warnings.length;
  return {
    key: `payment:${readiness.settingKey}`,
    label: 'Payment providers',
    category: 'payment',
    status: statusFromReadiness(readiness.ready, readiness.active, blockers, warnings),
    blockers,
    warnings,
    requiredEnvironmentVariables: readiness.requiredEnvironmentVariables,
    summary: readiness.ready ? 'Payment provider configuration is ready.' : 'Payment provider configuration needs attention.'
  };
}

export function buildNotificationProviderDiagnosticCard(readiness: NotificationProviderReadinessSummary): ProviderDiagnosticCard {
  const blockers = readiness.blockers.length;
  const warnings = readiness.warnings.length;
  return {
    key: `notification:${readiness.settingKey}`,
    label: 'Notification providers',
    category: 'notification',
    status: blockers > 0 || warnings > 0 ? 'needs_attention' : statusFromReadiness(readiness.ready, readiness.active, blockers, warnings),
    blockers,
    warnings,
    requiredEnvironmentVariables: readiness.requiredEnvironmentVariables,
    summary: readiness.ready ? 'Notification provider configuration is ready.' : 'Notification provider configuration needs attention.'
  };
}

export function buildWebhookProviderDiagnosticCard(readiness: WebhookReadinessSummary, logSummary: WebhookEventLogSummary): ProviderDiagnosticCard {
  const warnings = readiness.warnings.length + logSummary.needsAttention;
  return {
    key: `webhook:${readiness.settingKey}`,
    label: 'Webhook delivery',
    category: 'webhook',
    status: statusFromReadiness(readiness.ready, readiness.active, readiness.blockers.length, warnings),
    blockers: readiness.blockers.length,
    warnings,
    requiredEnvironmentVariables: readiness.secretEnvVar ? [readiness.secretEnvVar] : [],
    summary: logSummary.needsAttention ? `${logSummary.needsAttention} recent webhook events need attention.` : readiness.ready ? 'Webhook configuration is ready.' : 'Webhook configuration needs attention.'
  };
}

export function buildIntegrationRegistryDiagnosticCard(summary: IntegrationAppRegistrySummary): ProviderDiagnosticCard {
  return {
    key: 'integration:registry',
    label: 'Integration registry',
    category: 'integration',
    status: summary.needsAttention ? 'needs_attention' : summary.total ? 'ready' : 'not_configured',
    blockers: 0,
    warnings: summary.needsAttention,
    requiredEnvironmentVariables: [],
    summary: `${summary.total} integration app${summary.total === 1 ? '' : 's'} registered; ${summary.active} active.`
  };
}

export function buildApiTokenDiagnosticCard(summary: ApiTokenManagementSummary): ProviderDiagnosticCard {
  const warnings = summary.revoked + summary.expired + summary.expiringSoon;
  return {
    key: 'token:api',
    label: 'API tokens',
    category: 'token',
    status: warnings ? 'needs_attention' : summary.active ? 'ready' : 'not_configured',
    blockers: 0,
    warnings,
    requiredEnvironmentVariables: [],
    summary: `${summary.total} token metadata entr${summary.total === 1 ? 'y' : 'ies'} tracked; ${summary.active} active.`
  };
}

export function buildProviderDiagnosticsSummary(cards: ProviderDiagnosticCard[]): ProviderDiagnosticsSummary {
  const readyCount = cards.filter((card) => card.status === 'ready').length;
  const needsAttention = cards.filter((card) => card.status === 'needs_attention').length;
  const inactive = cards.filter((card) => card.status === 'inactive').length;
  const notConfigured = cards.filter((card) => card.status === 'not_configured').length;

  return {
    ready: needsAttention === 0 && inactive === 0 && notConfigured === 0,
    total: cards.length,
    readyCount,
    needsAttention,
    inactive,
    notConfigured,
    cards
  };
}

export const providerDiagnosticsService = {
  async summary(env: Record<string, string | undefined> = process.env): Promise<ProviderDiagnosticsSummary> {
    const [paymentSettings, notificationSettings, webhookConfigurations, webhookLogSummary, integrationSummary, apiTokenSummary] = await Promise.all([
      paymentProviderSettingsService.list(),
      notificationProviderSettingsService.list(),
      webhookConfigurationService.list(),
      webhookEventLogService.summary(10),
      integrationAppRegistryService.summary(),
      apiTokenManagementService.summary()
    ]);

    const payment = buildPaymentProviderDiagnosticCard(buildPaymentProviderReadinessSummary(paymentSettings[0], env));
    const notification = buildNotificationProviderDiagnosticCard(buildNotificationProviderReadinessSummary(notificationSettings[0], env));
    const webhook = buildWebhookProviderDiagnosticCard(buildWebhookReadinessSummary(webhookConfigurations[0], env), webhookLogSummary);
    const integration = buildIntegrationRegistryDiagnosticCard(integrationSummary);
    const apiToken = buildApiTokenDiagnosticCard(apiTokenSummary);

    return buildProviderDiagnosticsSummary([payment, notification, webhook, integration, apiToken]);
  }
};
