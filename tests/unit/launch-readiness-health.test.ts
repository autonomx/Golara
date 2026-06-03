import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildLaunchReadinessHealthSummary } from '../../lib/analytics/launch-readiness-health';
import type { PaymentGatewayReadiness } from '../../lib/checkout/payment-gateway-config';
import type { InquiryNotificationReadiness } from '../../lib/notifications/inquiry-notifications-core';
import type { RuntimeReadiness } from '../../lib/runtime-readiness';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function runtime(overrides: Partial<RuntimeReadiness> = {}): RuntimeReadiness {
  return {
    appMode: 'production',
    nodeEnv: 'production',
    vercelEnv: 'production',
    databaseUrlPresent: true,
    seedFallbackAllowed: false,
    productionSafe: true,
    mediaStorage: { provider: 'cloudinary', configured: true, productionSafe: true, summary: 'Media configured.', detail: 'Media ready.' },
    ...overrides
  };
}

function notifications(overrides: Partial<InquiryNotificationReadiness> = {}): InquiryNotificationReadiness {
  return { mode: 'webhook', ready: true, blockers: [], warnings: [], ...overrides };
}

function checkout(overrides: Partial<PaymentGatewayReadiness> = {}): PaymentGatewayReadiness {
  return { ready: true, mode: 'assisted', providers: ['manual'], blockers: [], warnings: [], ...overrides };
}

export async function runLaunchReadinessHealthTests() {
  const service = source('lib/analytics/launch-readiness-health.ts');
  const panel = source('components/admin/AdminLaunchReadinessHealthPanel.tsx');
  const orderPanel = source('components/admin/AdminOrderRevenueSummaryPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  const clear = buildLaunchReadinessHealthSummary({
    runtimeReadiness: runtime(),
    authConfigured: true,
    notificationReadiness: notifications(),
    checkoutReadiness: checkout()
  });
  assert.equal(clear.cards.length, 6);
  assert.equal(clear.readyCount, 6);
  assert.equal(clear.warningCount, 0);
  assert.equal(clear.blockedCount, 0);
  assert.equal(clear.launchBlocked, false);

  const mixed = buildLaunchReadinessHealthSummary({
    runtimeReadiness: runtime({ databaseUrlPresent: false, productionSafe: false }),
    authConfigured: false,
    notificationReadiness: notifications({ ready: false, blockers: [{ code: 'notification_blocker', severity: 'blocker', summary: 'Notification blocked.', detail: 'Configure notifications.' }] }),
    checkoutReadiness: checkout({ warnings: [{ code: 'checkout_warning', severity: 'warning', summary: 'Checkout warning.', detail: 'Review checkout.' }] })
  });
  assert.equal(mixed.launchBlocked, true);
  assert.equal(mixed.blockedCount, 4);
  assert.equal(mixed.warningCount, 1);
  assert.equal(mixed.cards.find((card) => card.key === 'checkout')?.status, 'warning');

  assert.match(service, /buildLaunchReadinessHealthSummary/);
  assert.match(service, /launchReadinessHealthService/);
  assert.match(service, /getRuntimeReadiness\(\)/);
  assert.match(service, /getCurrentInquiryNotificationReadiness\(\)/);
  assert.match(service, /getPaymentGatewayReadiness/);
  assert.match(panel, /AdminLaunchReadinessHealthPanel/);
  assert.match(panel, /Launch readiness health cards/);
  assert.match(panel, /summary\.cards\.map/);
  assert.match(orderPanel, /AdminLaunchReadinessHealthPanel/);
  assert.match(orderPanel, /launchReadinessHealthService\.summary\(\)/);
  assert.match(roadmap, /- \[x\] Add launch\/readiness health cards\./);

  console.log('launch-readiness-health.test.ts passed');
}
