import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildAggregateCustomerSegmentationSummary } from '../../lib/analytics/admin-analytics-customer-segmentation';

const SEGMENTATION_PATH = new URL('../../lib/analytics/admin-analytics-customer-segmentation.ts', import.meta.url);

export async function runCustomerSegmentationTests() {
  const now = new Date('2026-06-21T00:00:00.000Z');
  const summary = buildAggregateCustomerSegmentationSummary({
    now,
    minimumSegmentCustomerCount: 2,
    highValueRevenueCents: 20000,
    orders: [
      { id: '1', customerId: 'new-a', status: 'completed', totalCents: 5000, createdAt: new Date('2026-06-18T00:00:00.000Z') },
      { id: '2', customerId: 'repeat-a', status: 'completed', totalCents: 6000, createdAt: new Date('2026-06-10T00:00:00.000Z') },
      { id: '3', customerId: 'repeat-a', status: 'completed', totalCents: 7000, createdAt: new Date('2026-06-11T00:00:00.000Z') },
      { id: '4', customerId: 'repeat-b', status: 'completed', totalCents: 4000, createdAt: new Date('2026-06-12T00:00:00.000Z') },
      { id: '5', customerId: 'repeat-b', status: 'completed', totalCents: 5000, createdAt: new Date('2026-06-13T00:00:00.000Z') },
      { id: '6', customerId: 'high-a', status: 'completed', totalCents: 15000, createdAt: new Date('2026-05-01T00:00:00.000Z') },
      { id: '7', customerId: 'high-a', status: 'completed', totalCents: 15000, createdAt: new Date('2026-05-03T00:00:00.000Z') },
      { id: '8', customerId: 'old-a', status: 'completed', totalCents: 3000, createdAt: new Date('2026-01-03T00:00:00.000Z') },
      { id: '9', customerId: null, status: 'completed', totalCents: 2500, createdAt: new Date('2026-06-03T00:00:00.000Z') },
      { id: '10', customerId: null, status: 'cancelled', totalCents: 9999, createdAt: new Date('2026-06-04T00:00:00.000Z') }
    ]
  });

  assert.equal(summary.status, 'aggregate_segments_ready');
  assert.equal(summary.aggregateOnly, true);
  assert.equal(summary.rawIdentifiersIncluded, false);
  assert.equal(summary.minimumSegmentCustomerCount, 2);
  assert.equal(summary.generatedAt, '2026-06-21T00:00:00.000Z');
  assert.equal(summary.totalKnownCustomerCount, 5);
  assert.equal(summary.totalGuestOrderCount, 2);

  const activeRepeat = summary.segments.find((segment) => segment.key === 'active_repeat_customers');
  assert.ok(activeRepeat);
  assert.equal(activeRepeat.customerCount, 2);
  assert.equal(activeRepeat.orderCount, 4);
  assert.equal(activeRepeat.revenueCents, 22000);
  assert.equal(activeRepeat.averageOrderValueCents, 5500);
  assert.equal(activeRepeat.privacySuppressed, false);

  const highValue = summary.segments.find((segment) => segment.key === 'high_value_customers');
  assert.ok(highValue);
  assert.equal(highValue.customerCount, 1);
  assert.equal(highValue.revenueCents, 30000);
  assert.equal(highValue.privacySuppressed, true);

  const guest = summary.segments.find((segment) => segment.key === 'guest_orders');
  assert.ok(guest);
  assert.equal(guest.orderCount, 2);
  assert.equal(guest.revenueCents, 2500);
  assert.equal(guest.privacySuppressed, false);

  const source = await readFile(SEGMENTATION_PATH, 'utf8');
  assert.doesNotMatch(source, /email|phone|address|name/i);
  assert.doesNotMatch(source, /findMany\(|include:\s*\{|select:\s*\{/);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);

  console.log('customer-segmentation.test.ts passed');
}
