import 'server-only';

import { isAdminAuthConfigured } from '@/lib/admin-auth';
import { getPaymentGatewayConfig, getPaymentGatewayReadiness, type PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import { getCurrentInquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications';
import type { InquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications-core';
import { getRuntimeReadiness, type RuntimeReadiness } from '@/lib/runtime-readiness';

export type LaunchHealthStatus = 'ready' | 'warning' | 'blocked';

export type LaunchReadinessHealthCard = {
  key: string;
  label: string;
  status: LaunchHealthStatus;
  summary: string;
  detail: string;
};

export type LaunchReadinessHealthSummary = {
  cards: LaunchReadinessHealthCard[];
  readyCount: number;
  warningCount: number;
  blockedCount: number;
  launchBlocked: boolean;
  generatedAt: Date;
};

export const EMPTY_LAUNCH_READINESS_HEALTH_SUMMARY: LaunchReadinessHealthSummary = {
  cards: [],
  readyCount: 0,
  warningCount: 0,
  blockedCount: 0,
  launchBlocked: false,
  generatedAt: new Date(0)
};

function statusFromIssues(readiness: { blockers: unknown[]; warnings: unknown[] }): LaunchHealthStatus {
  if (readiness.blockers.length > 0) return 'blocked';
  if (readiness.warnings.length > 0) return 'warning';
  return 'ready';
}

function notificationCard(readiness: InquiryNotificationReadiness): LaunchReadinessHealthCard {
  const status = statusFromIssues(readiness);
  return {
    key: 'notifications',
    label: 'Inquiry notifications',
    status,
    summary: status === 'ready' ? 'Inquiry notifications have no blockers.' : readiness.blockers[0]?.summary ?? readiness.warnings[0]?.summary ?? 'Inquiry notification review needed.',
    detail: `Mode: ${readiness.mode}. Blockers: ${readiness.blockers.length}. Warnings: ${readiness.warnings.length}.`
  };
}

function checkoutCard(readiness: PaymentGatewayReadiness): LaunchReadinessHealthCard {
  const status = statusFromIssues(readiness);
  const providers = readiness.providers.length ? readiness.providers.join(', ') : 'none';
  return {
    key: 'checkout',
    label: 'Checkout readiness',
    status,
    summary: status === 'ready' ? 'Checkout gateway settings have no blockers.' : readiness.blockers[0]?.summary ?? readiness.warnings[0]?.summary ?? 'Checkout review needed.',
    detail: `Mode: ${readiness.mode}. Providers: ${providers}. Blockers: ${readiness.blockers.length}. Warnings: ${readiness.warnings.length}.`
  };
}

function runtimeCards(runtime: RuntimeReadiness, authConfigured: boolean): LaunchReadinessHealthCard[] {
  return [
    {
      key: 'runtime',
      label: 'Runtime mode',
      status: runtime.productionSafe ? (runtime.appMode === 'production' ? 'ready' : 'warning') : 'blocked',
      summary: runtime.productionSafe ? `Running in ${runtime.appMode} mode.` : 'Production runtime is missing required database configuration.',
      detail: `APP_MODE=${runtime.appMode}. NODE_ENV=${runtime.nodeEnv}. VERCEL_ENV=${runtime.vercelEnv}.`
    },
    {
      key: 'database',
      label: 'Database',
      status: runtime.databaseUrlPresent ? 'ready' : runtime.seedFallbackAllowed ? 'warning' : 'blocked',
      summary: runtime.databaseUrlPresent ? 'DATABASE_URL is configured.' : 'DATABASE_URL is missing.',
      detail: runtime.databaseUrlPresent ? 'Prisma-backed reads and writes can use the configured database.' : `Seed fallback allowed: ${runtime.seedFallbackAllowed ? 'yes' : 'no'}.`
    },
    {
      key: 'auth',
      label: 'Admin auth',
      status: authConfigured ? 'ready' : 'blocked',
      summary: authConfigured ? 'Admin auth secrets are configured.' : 'Admin auth secrets are missing.',
      detail: authConfigured ? 'Temporary password/session auth can gate staff workflows.' : 'Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET before launch.'
    },
    {
      key: 'media',
      label: 'Media storage',
      status: runtime.mediaStorage.productionSafe && runtime.mediaStorage.configured ? 'ready' : runtime.appMode === 'production' ? 'blocked' : 'warning',
      summary: runtime.mediaStorage.summary,
      detail: runtime.mediaStorage.detail
    }
  ];
}

export function buildLaunchReadinessHealthSummary(input: {
  runtimeReadiness: RuntimeReadiness;
  authConfigured: boolean;
  notificationReadiness: InquiryNotificationReadiness;
  checkoutReadiness: PaymentGatewayReadiness;
}, now = new Date()): LaunchReadinessHealthSummary {
  const cards = [
    ...runtimeCards(input.runtimeReadiness, input.authConfigured),
    notificationCard(input.notificationReadiness),
    checkoutCard(input.checkoutReadiness)
  ];
  const readyCount = cards.filter((card) => card.status === 'ready').length;
  const warningCount = cards.filter((card) => card.status === 'warning').length;
  const blockedCount = cards.filter((card) => card.status === 'blocked').length;

  return {
    cards,
    readyCount,
    warningCount,
    blockedCount,
    launchBlocked: blockedCount > 0,
    generatedAt: now
  };
}

export const launchReadinessHealthService = {
  summary(): LaunchReadinessHealthSummary {
    const runtimeReadiness = getRuntimeReadiness();
    const notificationReadiness = getCurrentInquiryNotificationReadiness();
    const checkoutReadiness = getPaymentGatewayReadiness(getPaymentGatewayConfig(process.env), process.env);
    return buildLaunchReadinessHealthSummary({
      runtimeReadiness,
      authConfigured: isAdminAuthConfigured(),
      notificationReadiness,
      checkoutReadiness
    });
  }
};
