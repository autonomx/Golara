import assert from 'node:assert/strict';
import type { CmsAuditInput, CmsIdentifiedRecord, CmsPublishedRecord } from '../../lib/cms/service-types';

export async function runCmsServiceTypesTests() {
  const auditInput: CmsAuditInput = {
    action: 'example.action',
    entity: 'example',
    entityId: 'entity-1',
    summary: 'Example audit payload',
    metadata: { ok: true }
  };
  const identified: CmsIdentifiedRecord = { id: 'entity-1' };
  const published: CmsPublishedRecord = { id: 'translation-1', isPublished: true };

  assert.equal(auditInput.entityId, identified.id);
  assert.equal(published.isPublished, true);

  console.log('cms-service-types.test.ts passed');
}
