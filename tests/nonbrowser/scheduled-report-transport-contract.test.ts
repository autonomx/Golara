import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildScheduledReportTransportContract,
  createDisabledScheduledReportTransportAdapter,
  createTestScheduledReportTransportAdapter,
  type AdminAnalyticsScheduledReportTransportPayload
} from '../../lib/analytics/admin-analytics-scheduled-report-transport';

const TRANSPORT_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-transport.ts', import.meta.url);
const LIVE_PATTERNS = ['send' + 'Mail', 'create' + 'Transport', 'nodemailer', 'smtp', 'fetch\\(', 'setInterval', 'setTimeout', 'cron'];
const LIVE_EXECUTION_PATTERN = new RegExp(LIVE_PATTERNS.join('|'), 'i');

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

  const testAdapter = createTestScheduledReportTransportAdapter();
  assert.equal(testAdapter.liveNetworkEnabled, false);
  const testResult = await testAdapter.dispatch(payload());
  assert.equal(testResult.status, 'transport_dispatched');
  assert.equal(testResult.sent, true);
  assert.equal(testResult.provider, 'test');

  const source = await readFile(TRANSPORT_PATH, 'utf8');
  assert.doesNotMatch(source, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-transport-contract.test.ts passed');
}
