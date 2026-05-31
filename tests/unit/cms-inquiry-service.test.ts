import assert from 'node:assert/strict';
import { createCmsInquiryService, isInquiryStatus } from '../../lib/cms/inquiry-service-core';

type AuditRecord = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: unknown;
};

export async function runCmsInquiryServiceTests() {
  const audits: AuditRecord[] = [];
  const updates: unknown[] = [];
  const followUps: unknown[] = [];

  const service = createCmsInquiryService({
    inquiryRepository: {
      async findUnique(args) {
        assert.deepEqual(args, { where: { id: 'inquiry-1' }, select: { status: true } });
        return { status: 'new' };
      },
      async update(args) {
        updates.push(args);
      }
    },
    followUpRepository: {
      async create(args) {
        followUps.push(args);
        return { id: `follow-up-${followUps.length}` };
      }
    },
    async auditWriter(input) {
      audits.push(input);
    }
  });

  await service.updateInquiry({ inquiryId: 'inquiry-1', status: 'contacted', staffNotes: 'Called customer.' });
  assert.deepEqual(updates[0], { where: { id: 'inquiry-1' }, data: { status: 'contacted', staffNotes: 'Called customer.' } });
  assert.deepEqual(followUps[0], { data: { inquiryId: 'inquiry-1', channel: 'system', note: 'Status changed from new to contacted.' } });
  assert.deepEqual(audits[0], {
    action: 'inquiry.update',
    entity: 'customerInquiry',
    entityId: 'inquiry-1',
    summary: 'Updated inquiry status to contacted',
    metadata: { previousStatus: 'new', status: 'contacted', staffNotesUpdated: true }
  });

  const noStatusChangeAudits: AuditRecord[] = [];
  const noStatusChangeFollowUps: unknown[] = [];
  const noStatusChangeService = createCmsInquiryService({
    inquiryRepository: {
      async findUnique() {
        return { status: 'confirmed' };
      },
      async update(args) {
        updates.push(args);
      }
    },
    followUpRepository: {
      async create(args) {
        noStatusChangeFollowUps.push(args);
        return { id: 'unexpected' };
      }
    },
    async auditWriter(input) {
      noStatusChangeAudits.push(input);
    }
  });
  await noStatusChangeService.updateInquiry({ inquiryId: 'inquiry-2', status: 'confirmed', staffNotes: '' });
  assert.deepEqual(noStatusChangeFollowUps, []);
  assert.equal(noStatusChangeAudits[0]?.metadata && typeof noStatusChangeAudits[0].metadata === 'object' && 'staffNotesUpdated' in noStatusChangeAudits[0].metadata ? noStatusChangeAudits[0].metadata.staffNotesUpdated : undefined, false);

  const followUp = await service.addFollowUp({ inquiryId: 'inquiry-1', note: 'Left voicemail.', channel: 'phone' });
  assert.equal(followUp.id, 'follow-up-2');
  assert.deepEqual(followUps[1], { data: { inquiryId: 'inquiry-1', note: 'Left voicemail.', channel: 'phone' } });
  assert.deepEqual(audits[1], {
    action: 'inquiry.follow_up.create',
    entity: 'customerInquiry',
    entityId: 'inquiry-1',
    summary: 'Added phone follow-up to inquiry',
    metadata: { followUpId: 'follow-up-2', channel: 'phone' }
  });

  assert.equal(isInquiryStatus('new'), true);
  assert.equal(isInquiryStatus('not-real'), false);

  console.log('cms-inquiry-service.test.ts passed');
}
