import assert from 'node:assert/strict';

import {
  normalizeOutboundDeliveryAdminFilters,
  normalizeOutboundDeliveryAdminPagination,
  normalizeOutboundDeliveryAdminSort
} from '../../lib/settings/outbound-webhook-admin-read-model';
import {
  OUTBOUND_WEBHOOK_ADMIN_SAFE_FIELDS,
  buildOutboundWebhookAdminReadQuerySpec
} from '../../lib/settings/outbound-webhook-admin-read-query';

export async function runOutboundWebhookAdminReadQueryTests() {
  const filters = normalizeOutboundDeliveryAdminFilters({
    status: 'retry_wait',
    configurationKey: ' default-webhook-configuration ',
    eventType: 'order.created',
    eventRef: 'order_123',
    idempotencyKey: 'idem-123',
    payloadDigest: 'sha256:abc',
    createdFrom: '2026-06-01',
    updatedTo: '2026-06-05T12:00:00.000Z'
  });
  const sort = normalizeOutboundDeliveryAdminSort({ field: 'updatedAt', direction: 'asc' });
  const pagination = normalizeOutboundDeliveryAdminPagination({ pageSize: 10, cursor: ' cursor-1 ' });
  const spec = buildOutboundWebhookAdminReadQuerySpec({ filters, sort, pagination });

  assert.equal(spec.where.status, 'retry_wait');
  assert.equal(spec.where.configurationKey, 'default-webhook-configuration');
  assert.deepEqual(spec.where.createdAt, { gte: '2026-06-01T00:00:00.000Z' });
  assert.deepEqual(spec.where.updatedAt, { lte: '2026-06-05T12:00:00.000Z' });
  assert.deepEqual(spec.orderBy, { field: 'updatedAt', direction: 'asc' });
  assert.equal(spec.take, 11);
  assert.equal(spec.cursor, 'cursor-1');
  assert.deepEqual(spec.rejected, []);
  assert.deepEqual(spec.auditLabels, ['filters:8', 'sort:updatedAt:asc', 'take:11', 'cursor:present']);

  for (const field of OUTBOUND_WEBHOOK_ADMIN_SAFE_FIELDS) {
    assert.equal(spec.select[field], true);
  }
  assert.equal(Object.prototype.hasOwnProperty.call(spec.select, 'rawPayload'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(spec.select, 'secretValue'), false);

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
  assert.deepEqual(rejectedSpec.auditLabels, ['filters:0', 'sort:createdAt:desc', 'take:26', 'cursor:absent']);

  console.log('outbound-webhook-admin-read-query.test.ts passed');
}
