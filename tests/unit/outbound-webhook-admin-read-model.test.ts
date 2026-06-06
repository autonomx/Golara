import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildOutboundDeliveryDetailDto,
  buildOutboundDeliveryListItemDto,
  buildOutboundDeliveryPaginationEnvelope,
  normalizeOutboundDeliveryAdminFilters,
  normalizeOutboundDeliveryAdminPagination,
  normalizeOutboundDeliveryAdminSort,
  type OutboundWebhookAdminRecordSnapshot
} from '../../lib/settings/outbound-webhook-admin-read-model';
import { readOutboundWebhookAdminMemory } from '../../lib/settings/outbound-webhook-admin-read-memory';
import {
  OUTBOUND_WEBHOOK_ADMIN_SAFE_FIELDS,
  buildOutboundWebhookAdminReadQuerySpec
} from '../../lib/settings/outbound-webhook-admin-read-query';
import {
  buildOutboundWebhookAdminDetailReadPlan,
  buildOutboundWebhookAdminListReadPlan
} from '../../lib/settings/outbound-webhook-admin-read-plan';

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

function assertPhase35ReadHelperContractNote() {
  const note = readFileSync(join(process.cwd(), 'docs/production-roadmap-phase35-admin-read-helper-contract.md'), 'utf8');
  const requiredPhrases = [
    'lib/settings/outbound-webhook-admin-read-model.ts',
    'lib/settings/outbound-webhook-admin-read-query.ts',
    'lib/settings/outbound-webhook-admin-read-plan.ts',
    'lib/settings/outbound-webhook-admin-read-memory.ts',
    'pure helper',
    'storage access',
    'endpoint handlers',
    'admin pages',
    'state mutation',
    'external calls',
    'signing',
    'retry',
    'recovery controls',
    'cursor',
    'hasNextPage',
    'nextCursor',
    'afterCursor'
  ];

  for (const phrase of requiredPhrases) {
    assert.ok(note.includes(phrase), `Phase 35 read helper contract note must mention ${phrase}`);
  }
}

export async function runOutboundWebhookAdminReadModelTests() {
  assertPhase35ReadHelperContractNote();

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

  const querySpec = buildOutboundWebhookAdminReadQuerySpec({
    filters: normalizeOutboundDeliveryAdminFilters({
      status: 'retry_wait',
      configurationKey: 'default-webhook-configuration',
      eventType: 'order.created',
      eventRef: 'order_123',
      idempotencyKey: 'idem-123',
      payloadDigest: 'sha256:abc',
      createdFrom: '2026-06-01',
      updatedTo: '2026-06-05T12:00:00.000Z'
    }),
    sort: normalizeOutboundDeliveryAdminSort({ field: 'updatedAt', direction: 'asc' }),
    pagination: normalizeOutboundDeliveryAdminPagination({ pageSize: 10, cursor: ' cursor-1 ' })
  });
  assert.equal(querySpec.where.status, 'retry_wait');
  assert.deepEqual(querySpec.where.createdAt, { gte: '2026-06-01T00:00:00.000Z' });
  assert.deepEqual(querySpec.where.updatedAt, { lte: '2026-06-05T12:00:00.000Z' });
  assert.deepEqual(querySpec.orderBy, { field: 'updatedAt', direction: 'asc' });
  assert.equal(querySpec.take, 11);
  assert.equal(querySpec.cursor, 'cursor-1');
  assert.deepEqual(querySpec.auditLabels, ['filters:8', 'sort:updatedAt:asc', 'take:11', 'cursor:present']);
  for (const field of OUTBOUND_WEBHOOK_ADMIN_SAFE_FIELDS) assert.equal(querySpec.select[field], true);
  assert.equal(Object.prototype.hasOwnProperty.call(querySpec.select, 'rawPayload'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(querySpec.select, 'secretValue'), false);

  const blankCursorSpec = buildOutboundWebhookAdminReadQuerySpec({
    filters: normalizeOutboundDeliveryAdminFilters(),
    sort: normalizeOutboundDeliveryAdminSort(),
    pagination: normalizeOutboundDeliveryAdminPagination({ pageSize: 5, cursor: '   ' })
  });
  assert.equal(blankCursorSpec.cursor, null);
  assert.deepEqual(blankCursorSpec.rejected, []);
  assert.ok(blankCursorSpec.auditLabels.includes('cursor:absent'));

  const invalidCursorSpec = buildOutboundWebhookAdminReadQuerySpec({
    filters: normalizeOutboundDeliveryAdminFilters(),
    sort: normalizeOutboundDeliveryAdminSort(),
    pagination: normalizeOutboundDeliveryAdminPagination({ pageSize: 5, cursor: 'bad cursor!' })
  });
  assert.equal(invalidCursorSpec.cursor, null);
  assert.deepEqual(invalidCursorSpec.rejected, ['cursor']);
  assert.ok(invalidCursorSpec.auditLabels.includes('cursor:absent'));

  const longCursorSpec = buildOutboundWebhookAdminReadQuerySpec({
    filters: normalizeOutboundDeliveryAdminFilters(),
    sort: normalizeOutboundDeliveryAdminSort(),
    pagination: normalizeOutboundDeliveryAdminPagination({ pageSize: 5, cursor: 'a'.repeat(161) })
  });
  assert.equal(longCursorSpec.cursor, null);
  assert.deepEqual(longCursorSpec.rejected, ['cursor']);

  const rejectedSpec = buildOutboundWebhookAdminReadQuerySpec({
    filters: normalizeOutboundDeliveryAdminFilters({ status: 'unsupported', createdTo: 'bad-date' }),
    sort: normalizeOutboundDeliveryAdminSort({ field: 'unsupported', direction: 'sideways' }),
    pagination: normalizeOutboundDeliveryAdminPagination({ pageSize: 'large' })
  });
  assert.deepEqual(rejectedSpec.where, {});
  assert.deepEqual(rejectedSpec.orderBy, { field: 'createdAt', direction: 'desc' });
  assert.equal(rejectedSpec.take, 26);
  assert.equal(rejectedSpec.cursor, null);
  assert.deepEqual(rejectedSpec.rejected, ['status', 'createdTo', 'field', 'direction', 'pageSize']);

  const listPlan = buildOutboundWebhookAdminListReadPlan(querySpec);
  assert.equal(listPlan.kind, 'list');
  assert.equal(listPlan.deliveryId, null);
  assert.deepEqual(listPlan.rejected, []);
  assert.deepEqual(listPlan.auditLabels.slice(0, 2), ['kind:list', 'filters:8']);

  const detailPlan = buildOutboundWebhookAdminDetailReadPlan({ deliveryId: ' delivery_123 ', query: querySpec });
  assert.equal(detailPlan.kind, 'detail');
  assert.equal(detailPlan.deliveryId, 'delivery_123');
  assert.deepEqual(detailPlan.rejected, []);
  assert.deepEqual(detailPlan.auditLabels.slice(0, 3), ['kind:detail', 'delivery:present', 'filters:8']);

  const missingDetailPlan = buildOutboundWebhookAdminDetailReadPlan({ deliveryId: ' ', query: rejectedSpec });
  assert.equal(missingDetailPlan.deliveryId, null);
  assert.deepEqual(missingDetailPlan.rejected, ['status', 'createdTo', 'field', 'direction', 'pageSize', 'deliveryId']);
  assert.deepEqual(missingDetailPlan.auditLabels.slice(0, 2), ['kind:detail', 'delivery:missing']);

  const secondRecord: OutboundWebhookAdminRecordSnapshot = {
    ...baseRecord,
    id: 'delivery_456',
    eventRef: 'order_456',
    idempotencyKey: 'idem-456',
    updatedAt: '2026-06-05T09:45:00.000Z'
  };
  const thirdRecord: OutboundWebhookAdminRecordSnapshot = {
    ...baseRecord,
    id: 'delivery_789',
    eventRef: 'order_789',
    idempotencyKey: 'idem-789',
    updatedAt: '2026-06-05T10:00:00.000Z'
  };
  const memoryQuerySpec = buildOutboundWebhookAdminReadQuerySpec({
    filters: normalizeOutboundDeliveryAdminFilters({
      status: 'retry_wait',
      configurationKey: 'default-webhook-configuration',
      eventType: 'order.created',
      payloadDigest: 'sha256:abc',
      createdFrom: '2026-06-01',
      updatedTo: '2026-06-05T12:00:00.000Z'
    }),
    sort: normalizeOutboundDeliveryAdminSort({ field: 'updatedAt', direction: 'asc' }),
    pagination: normalizeOutboundDeliveryAdminPagination({ pageSize: 10 })
  });
  const memoryListPlan = buildOutboundWebhookAdminListReadPlan(memoryQuerySpec);
  const memoryDetailPlan = buildOutboundWebhookAdminDetailReadPlan({ deliveryId: ' delivery_123 ', query: memoryQuerySpec });
  const memoryList = readOutboundWebhookAdminMemory({
    records: [secondRecord, baseRecord],
    plan: memoryListPlan,
    now: '2026-06-05T11:00:00.000Z'
  });
  assert.equal(memoryList.items.length, 2);
  assert.equal(memoryList.items[0].id, 'delivery_123');
  assert.equal(memoryList.detail, null);
  assert.equal(memoryList.hasNextPage, false);
  assert.equal(memoryList.nextCursor, null);
  assert.deepEqual(memoryList.rejected, []);
  assert.deepEqual(memoryList.auditLabels.slice(0, 6), ['memory-read', 'matched:2', 'afterCursor:2', 'returned:2', 'hasNext:false', 'kind:list']);

  const pagedQuerySpec = buildOutboundWebhookAdminReadQuerySpec({
    filters: normalizeOutboundDeliveryAdminFilters({
      status: 'retry_wait',
      configurationKey: 'default-webhook-configuration',
      eventType: 'order.created',
      payloadDigest: 'sha256:abc'
    }),
    sort: normalizeOutboundDeliveryAdminSort({ field: 'updatedAt', direction: 'asc' }),
    pagination: normalizeOutboundDeliveryAdminPagination({ pageSize: 2 })
  });
  const pagedMemory = readOutboundWebhookAdminMemory({
    records: [thirdRecord, secondRecord, baseRecord],
    plan: buildOutboundWebhookAdminListReadPlan(pagedQuerySpec),
    now: '2026-06-05T11:00:00.000Z'
  });
  assert.equal(pagedMemory.items.length, 2);
  assert.equal(pagedMemory.items[0].id, 'delivery_123');
  assert.equal(pagedMemory.items[1].id, 'delivery_456');
  assert.equal(pagedMemory.hasNextPage, true);
  assert.equal(pagedMemory.nextCursor, 'delivery_789');
  assert.deepEqual(pagedMemory.auditLabels.slice(0, 6), ['memory-read', 'matched:3', 'afterCursor:3', 'returned:2', 'hasNext:true', 'kind:list']);

  const continuedQuerySpec = buildOutboundWebhookAdminReadQuerySpec({
    filters: normalizeOutboundDeliveryAdminFilters({
      status: 'retry_wait',
      configurationKey: 'default-webhook-configuration',
      eventType: 'order.created',
      payloadDigest: 'sha256:abc'
    }),
    sort: normalizeOutboundDeliveryAdminSort({ field: 'updatedAt', direction: 'asc' }),
    pagination: normalizeOutboundDeliveryAdminPagination({ pageSize: 2, cursor: 'delivery_456' })
  });
  const continuedMemory = readOutboundWebhookAdminMemory({
    records: [thirdRecord, secondRecord, baseRecord],
    plan: buildOutboundWebhookAdminListReadPlan(continuedQuerySpec),
    now: '2026-06-05T11:00:00.000Z'
  });
  assert.equal(continuedMemory.items.length, 1);
  assert.equal(continuedMemory.items[0].id, 'delivery_789');
  assert.equal(continuedMemory.hasNextPage, false);
  assert.equal(continuedMemory.nextCursor, null);
  assert.deepEqual(continuedMemory.auditLabels.slice(0, 6), ['memory-read', 'matched:3', 'afterCursor:1', 'returned:1', 'hasNext:false', 'kind:list']);

  const missingCursorQuerySpec = buildOutboundWebhookAdminReadQuerySpec({
    filters: normalizeOutboundDeliveryAdminFilters({ status: 'retry_wait' }),
    sort: normalizeOutboundDeliveryAdminSort({ field: 'updatedAt', direction: 'asc' }),
    pagination: normalizeOutboundDeliveryAdminPagination({ pageSize: 2, cursor: 'delivery_missing' })
  });
  const missingCursorMemory = readOutboundWebhookAdminMemory({
    records: [thirdRecord, secondRecord, baseRecord],
    plan: buildOutboundWebhookAdminListReadPlan(missingCursorQuerySpec),
    now: '2026-06-05T11:00:00.000Z'
  });
  assert.equal(missingCursorMemory.items.length, 0);
  assert.equal(missingCursorMemory.hasNextPage, false);
  assert.deepEqual(missingCursorMemory.auditLabels.slice(0, 6), ['memory-read', 'matched:3', 'afterCursor:0', 'returned:0', 'hasNext:false', 'kind:list']);

  const memoryDetail = readOutboundWebhookAdminMemory({
    records: [secondRecord, baseRecord],
    plan: memoryDetailPlan,
    now: '2026-06-05T11:00:00.000Z'
  });
  assert.equal(memoryDetail.items.length, 0);
  assert.equal(memoryDetail.detail?.id, 'delivery_123');
  assert.equal(memoryDetail.detail?.redactedDeliverySummary, 'order.created:order_123:retry_wait');
  assert.deepEqual(memoryDetail.rejected, []);

  const missingMemoryDetail = readOutboundWebhookAdminMemory({
    records: [secondRecord, baseRecord],
    plan: missingDetailPlan,
    now: '2026-06-05T11:00:00.000Z'
  });
  assert.equal(missingMemoryDetail.detail, null);
  assert.deepEqual(missingMemoryDetail.rejected, ['status', 'createdTo', 'field', 'direction', 'pageSize', 'deliveryId']);

  console.log('outbound-webhook-admin-read-model.test.ts passed');
}
