import assert from 'node:assert/strict';

import {
  buildOutboundDeliveryDetailDto,
  buildOutboundDeliveryListItemDto,
  buildOutboundDeliveryPaginationEnvelope,
  normalizeOutboundDeliveryAdminFilters,
  normalizeOutboundDeliveryAdminPagination,
  normalizeOutboundDeliveryAdminSort,
  type OutboundWebhookAdminRecordSnapshot
} from '../../lib/settings/outbound-webhook-admin-read-model';

const baseRecord: OutboundWebhookAdminRecordSnapshot = {
  id: 'delivery_123',
  configurationKey: 'default-webhook-configuration',
  eventType: 'order.created',
  eventRef: 'order_123',
  status: 'retry_wait',
  attemptCount: 2,
  nextEligibleAttemptAt: '2026-06-05T10:00:00.000Z',
  lastOutcomeCategory: 'timeout',
  lastResponseCode: 504,
  deadLetterSummary: null,
  payloadDigest: 'sha256:abc',
  idempotencyKey: 'default-webhook-configuration:order.created:order_123:sha256:abc',
  createdAt: '2026-06-05T09:00:00.000Z',
  updatedAt: '2026-06-05T09:30:00.000Z'
};

export async function runOutboundWebhookAdminReadModelTests() {
  const filters = normalizeOutboundDeliveryAdminFilters({
    status: 'retry_wait',
    configurationKey: ' default-webhook-configuration ',
    eventType: 'order.created',
    eventRef: 'order_123',
    idempotencyKey: baseRecord.idempotencyKey,
    payloadDigest: 'sha256:abc',
    createdFrom: '2026-06-01',
    createdTo: 'bad-date'
  });
  assert.equal(filters.status, 'retry_wait');
  assert.equal(filters.configurationKey, 'default-webhook-configuration');
  assert.equal(filters.payloadDigest, 'sha256:abc');
  assert.equal(filters.createdFrom, '2026-06-01T00:00:00.000Z');
  assert.deepEqual(filters.rejected, ['createdTo']);

  const rejectedFilters = normalizeOutboundDeliveryAdminFilters({ status: 'sent-now' });
  assert.equal(rejectedFilters.status, null);
  assert.deepEqual(rejectedFilters.rejected, ['status']);

  assert.deepEqual(normalizeOutboundDeliveryAdminSort({ field: 'attemptCount', direction: 'asc' }), {
    field: 'attemptCount',
    direction: 'asc',
    rejected: []
  });
  assert.deepEqual(normalizeOutboundDeliveryAdminSort({ field: 'unsupported', direction: 'sideways' }), {
    field: 'createdAt',
    direction: 'desc',
    rejected: ['field', 'direction']
  });

  assert.deepEqual(normalizeOutboundDeliveryAdminPagination({ pageSize: '500', cursor: ' next-cursor ' }), {
    pageSize: 100,
    cursor: 'next-cursor',
    rejected: []
  });
  assert.deepEqual(normalizeOutboundDeliveryAdminPagination({ pageSize: 'large' }), {
    pageSize: 25,
    cursor: null,
    rejected: ['pageSize']
  });

  const listItem = buildOutboundDeliveryListItemDto(baseRecord, { now: '2026-06-05T11:00:00.000Z' });
  assert.equal(listItem.id, 'delivery_123');
  assert.equal(listItem.safeOutcomeLabel, 'timeout');
  assert.equal(listItem.terminalLabel, 'not terminal');
  assert.equal(listItem.deadLetterLabel, 'not dead lettered');
  assert.equal(listItem.staleLabel, 'stale retry wait');
  assert.equal(listItem.attemptCount, 2);

  const detail = buildOutboundDeliveryDetailDto(
    {
      ...baseRecord,
      status: 'dead_letter',
      deadLetterSummary: 'attempts exhausted',
      attemptCount: -2
    },
    { now: '2026-06-05T11:00:00.000Z' }
  );
  assert.equal(detail.attemptCount, 0);
  assert.equal(detail.terminalLabel, 'exhausted');
  assert.equal(detail.deadLetterLabel, 'dead lettered with summary');
  assert.equal(detail.redactedDeliverySummary, 'order.created:order_123:dead_letter');
  assert.deepEqual(detail.redactionAuditLabels, [
    'raw_payload:excluded',
    'secret_values:excluded',
    'receiver_body:excluded'
  ]);

  const envelope = buildOutboundDeliveryPaginationEnvelope({
    items: [listItem],
    pageSize: 25,
    nextCursor: 'cursor-2',
    filters,
    sort: normalizeOutboundDeliveryAdminSort()
  });
  assert.equal(envelope.hasNextPage, true);
  assert.equal(envelope.nextCursor, 'cursor-2');
  assert.equal(envelope.normalizedSortSummary.field, 'createdAt');

  console.log('outbound-webhook-admin-read-model.test.ts passed');
}
