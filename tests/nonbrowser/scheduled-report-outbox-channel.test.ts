import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildScheduledReportOutboxChannelResult } from '../../lib/analytics/admin-analytics-scheduled-report-outbox-channel';
import type { AdminAnalyticsScheduledReportTransportPayload } from '../../lib/analytics/admin-analytics-scheduled-report-transport';

const CHANNEL_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-outbox-channel.ts', import.meta.url);

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

export async function runScheduledReportOutboxChannelTests() {
  const missing = buildScheduledReportOutboxChannelResult({
    payload: payload(),
    channel: {
      channelKey: null,
      destinationKey: null,
      credentialRef: null,
      payloadSigningRef: null
    }
  });
  assert.equal(missing.status, 'outbox_channel_blocked');
  assert.equal(missing.configured, false);
  assert.equal(missing.runtimeEnabled, false);
  assert.equal(missing.operatorApproved, false);
  assert.equal(missing.directClientUsed, false);
  assert.ok(missing.blockers.includes('channel key is required'));

  const configuredButOff = buildScheduledReportOutboxChannelResult({
    payload: payload(),
    channel: {
      channelKey: 'primary',
      destinationKey: 'owner',
      credentialRef: 'secret/ref',
      payloadSigningRef: 'signing/ref'
    }
  });
  assert.equal(configuredButOff.status, 'outbox_channel_blocked');
  assert.equal(configuredButOff.configured, true);
  assert.equal(configuredButOff.runtimeEnabled, false);
  assert.equal(configuredButOff.directClientUsed, false);

  const ready = buildScheduledReportOutboxChannelResult({
    payload: payload(),
    channel: {
      channelKey: 'primary',
      destinationKey: 'owner',
      credentialRef: 'secret/ref',
      payloadSigningRef: 'signing/ref',
      runtimeEnabled: true,
      operatorApproved: true
    }
  });
  assert.equal(ready.status, 'outbox_channel_ready');
  assert.equal(ready.configured, true);
  assert.equal(ready.runtimeEnabled, true);
  assert.equal(ready.operatorApproved, true);
  assert.equal(ready.directClientUsed, false);
  assert.equal(ready.payloadSummary.assetCount, 1);
  assert.equal(ready.blockers.length, 0);

  const source = await readFile(CHANNEL_PATH, 'utf8');
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron/i);
  assert.doesNotMatch(source, /fetch\(|sendMail|createTransport|nodemailer|smtp/i);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-outbox-channel.test.ts passed');
}
