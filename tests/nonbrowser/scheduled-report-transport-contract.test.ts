import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  ADMIN_ANALYTICS_SCHEDULED_REPORT_PROVIDER_DISPATCH_ENABLED_ENV,
  buildScheduledReportTransportContract,
  createDisabledScheduledReportTransportAdapter,
  createOwnerOutboxScheduledReportTransportAdapter,
  createProviderScheduledReportTransportAdapter,
  createTestScheduledReportTransportAdapter,
  validateScheduledReportOwnerOutbox,
  validateScheduledReportProviderDispatch,
  type AdminAnalyticsScheduledReportTransportPayload
} from '../../lib/analytics/admin-analytics-scheduled-report-transport';

const TRANSPORT_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-transport.ts', import.meta.url);
const LIVE_EXECUTION_PATTERN = /sendMail|createTransport|nodemailer|smtp|fetch\(|setInterval|setTimeout|cron/i;

function payload(): AdminAnalyticsScheduledReportTransportPayload {
  return {
    reportId: 'sched_1',
    reportKey: 'weekly-owner',
    label: 'Weekly owner report',
    generatedAt: '2026-01-04T00:00:00.000Z',
    recipientCount: 1,
    assets: [
      {
        filename: 'business.csv',
        contentType: 'text/csv',
        byteLength: 42,
        rowCount: 2
      }
    ]
  };
}

export async function runScheduledReportTransportContractTests() {
  const contract = buildScheduledReportTransportContract();
  assert.equal(contract.status, 'transport_contract_disabled');
  assert.equal(contract.enabled, false);
  assert.equal(contract.configured, false);
  assert.equal(contract.liveNetworkEnabled, false);
  assert.equal(contract.emailProviderConfigured, false);
  assert.equal(contract.defaultAdapter, 'disabled');
  assert.deepEqual(contract.allowedAssetContentTypes, ['text/csv']);
  assert.ok(contract.blockedCapabilities.includes('network delivery'));

  const disabled = createDisabledScheduledReportTransportAdapter();
  assert.equal(disabled.configured, false);
  assert.equal(disabled.liveNetworkEnabled, false);
  const disabledResult = await disabled.dispatch(payload());
  assert.equal(disabledResult.status, 'transport_disabled');
  assert.equal(disabledResult.sent, false);
  assert.equal(disabledResult.provider, 'disabled');
  assert.equal(disabledResult.payloadSummary.assetCount, 1);
  assert.ok(disabledResult.blockers.includes('scheduled report transport adapter is disabled'));

  const missingConfig = validateScheduledReportOwnerOutbox({
    destinationKey: null,
    sourceLabel: null,
    credentialRef: null
  });
  assert.equal(missingConfig.status, 'owner_outbox_invalid');
  assert.equal(missingConfig.configured, false);
  assert.equal(missingConfig.runtimeEnabled, false);
  assert.ok(missingConfig.blockers.includes('owner destination key is required'));

  const configuredButOff = validateScheduledReportOwnerOutbox({
    destinationKey: 'owner-primary',
    sourceLabel: 'scheduled-reports',
    credentialRef: 'owner-outbox-ref'
  });
  assert.equal(configuredButOff.status, 'owner_outbox_invalid');
  assert.equal(configuredButOff.configured, true);
  assert.equal(configuredButOff.runtimeEnabled, false);

  const ownerAdapter = createOwnerOutboxScheduledReportTransportAdapter({
    destinationKey: 'owner-primary',
    sourceLabel: 'scheduled-reports',
    credentialRef: 'owner-outbox-ref'
  });
  assert.equal(ownerAdapter.configured, true);
  assert.equal(ownerAdapter.liveNetworkEnabled, false);
  const ownerResult = await ownerAdapter.dispatch(payload());
  assert.equal(ownerResult.status, 'transport_disabled');
  assert.equal(ownerResult.sent, false);
  assert.equal(ownerResult.provider, 'owner-outbox');
  assert.ok(ownerResult.blockers.includes('owner outbox runtime flag is disabled'));

  const providerMissing = validateScheduledReportProviderDispatch({
    destinationKey: 'owner-primary',
    sourceLabel: 'scheduled-reports',
    credentialRef: 'owner-outbox-ref',
    providerKey: null,
    runtimeEnabled: true
  });
  assert.equal(providerMissing.status, 'owner_outbox_invalid');
  assert.equal(providerMissing.configured, false);
  assert.ok(providerMissing.blockers.includes('provider key is required'));

  const providerNoHandler = createProviderScheduledReportTransportAdapter({
    destinationKey: 'owner-primary',
    sourceLabel: 'scheduled-reports',
    credentialRef: 'owner-outbox-ref',
    providerKey: 'provider-ref',
    runtimeEnabled: true
  });
  assert.equal(providerNoHandler.configured, true);
  assert.equal(providerNoHandler.liveNetworkEnabled, false);
  const providerNoHandlerResult = await providerNoHandler.dispatch(payload());
  assert.equal(providerNoHandlerResult.status, 'transport_disabled');
  assert.equal(providerNoHandlerResult.provider, 'owner-provider');
  assert.ok(providerNoHandlerResult.blockers.includes('provider dispatch handler is not configured'));

  const calls: Array<{ reportId: string; providerKey: string }> = [];
  const providerAdapter = createProviderScheduledReportTransportAdapter(
    {
      destinationKey: 'owner-primary',
      sourceLabel: 'scheduled-reports',
      credentialRef: 'owner-outbox-ref',
      providerKey: 'provider-ref',
      signingRef: 'signing-ref',
      runtimeEnabled: true
    },
    async (transportPayload, context) => {
      calls.push({ reportId: transportPayload.reportId, providerKey: context.providerKey });
      return { providerMessageId: 'msg_1' };
    }
  );
  assert.equal(providerAdapter.configured, true);
  assert.equal(providerAdapter.liveNetworkEnabled, true);
  const providerResult = await providerAdapter.dispatch(payload());
  assert.equal(providerResult.status, 'transport_dispatched');
  assert.equal(providerResult.sent, true);
  assert.equal(providerResult.provider, 'owner-provider');
  assert.equal(providerResult.providerMessageId, 'msg_1');
  assert.deepEqual(calls, [{ reportId: 'sched_1', providerKey: 'provider-ref' }]);

  const testAdapter = createTestScheduledReportTransportAdapter();
  assert.equal(testAdapter.liveNetworkEnabled, false);
  const testResult = await testAdapter.dispatch(payload());
  assert.equal(testResult.status, 'transport_dispatched');
  assert.equal(testResult.sent, true);
  assert.equal(testResult.provider, 'test');

  const source = await readFile(TRANSPORT_PATH, 'utf8');
  assert.match(source, /ADMIN_ANALYTICS_SCHEDULED_REPORT_PROVIDER_DISPATCH_ENABLED/);
  assert.doesNotMatch(source, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-transport-contract.test.ts passed');
}
