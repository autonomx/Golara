import assert from 'node:assert/strict';
import { createCmsInquiryService, isInquiryStatus } from '../../lib/cms/inquiry-service-core';

const assignedAt = new Date('2026-05-31T12:00:00.000Z');

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
        if ('assignedAdminId' in args.select) {
          assert.deepEqual(args, {
            where: { id: 'inquiry-1' },
            select: {
              status: true,
              assignedAdminId: true,
              assignedAdminLabel: true,
              assignedAdminEmail: true,
              assignedAdminRole: true,
              assignedAt: true
            }
          });
          return {
            status: 'new',
            assignedAdminId: null,
            assignedAdminLabel: null,
            assignedAdminEmail: null,
            assignedAdminRole: null,
            assignedAt: null
          };
        }
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

  await service.assignInquiry({ inquiryId: 'inquiry-1', assignee: { adminId: 'staff@example.invalid', label: 'Staff User', email: 'staff@example.invalid', role: 'staff', assignedAt } });
  assert.deepEqual(updates[2], {
    where: { id: 'inquiry-1' },
    data: {
      assignedAdminId: 'staff@example.invalid',
      assignedAdminLabel: 'Staff User',
      assignedAdminEmail: 'staff@example.invalid',
      assignedAdminRole: 'staff',
      assignedAt
    }
  });
  assert.deepEqual(followUps[1], { data: { inquiryId: 'inquiry-1', channel: 'system', note: 'Assignment set to Staff User.' } });
  assert.deepEqual(audits[1], {
    action: 'inquiry.assignment.update',
    entity: 'customerInquiry',
    entityId: 'inquiry-1',
    summary: 'Assignment set to Staff User.',
    metadata: { previousAssignee: 'Unassigned', assignee: 'Staff User', assigned: true }
  });

  const assignmentClearAudits: AuditRecord[] = [];
  const assignmentClearUpdates: unknown[] = [];
  const assignmentClearFollowUps: unknown[] = [];
  const assignmentClearService = createCmsInquiryService({
    inquiryRepository: {
      async findUnique() {
        return {
          status: 'contacted',
          assignedAdminId: 'staff@example.invalid',
          assignedAdminLabel: 'Staff User',
          assignedAdminEmail: 'staff@example.invalid',
          assignedAdminRole: 'staff',
          assignedAt
        };
      },
      async update(args) {
        assignmentClearUpdates.push(args);
      }
    },
    followUpRepository: {
      async create(args) {
        assignmentClearFollowUps.push(args);
        return { id: 'assignment-clear-follow-up' };
      }
    },
    async auditWriter(input) {
      assignmentClearAudits.push(input);
    }
  });
  await assignmentClearService.assignInquiry({ inquiryId: 'inquiry-2', assignee: undefined });
  assert.deepEqual(assignmentClearUpdates[0], {
    where: { id: 'inquiry-2' },
    data: {
      assignedAdminId: null,
      assignedAdminLabel: null,
      assignedAdminEmail: null,
      assignedAdminRole: null,
      assignedAt: null
    }
  });
  assert.deepEqual(assignmentClearFollowUps[0], { data: { inquiryId: 'inquiry-2', channel: 'system', note: 'Assignment cleared from Staff User.' } });
  assert.equal(assignmentClearAudits[0]?.summary, 'Assignment cleared from Staff User.');

  const followUp = await service.addFollowUp({ inquiryId: 'inquiry-1', note: 'Left voicemail.', channel: 'phone' });
  assert.equal(followUp.id, 'follow-up-3');
  assert.deepEqual(followUps[2], { data: { inquiryId: 'inquiry-1', note: 'Left voicemail.', channel: 'phone' } });
  assert.deepEqual(audits[2], {
    action: 'inquiry.follow_up.create',
    entity: 'customerInquiry',
    entityId: 'inquiry-1',
    summary: 'Added phone follow-up to inquiry',
    metadata: { followUpId: 'follow-up-3', channel: 'phone' }
  });

  assert.equal(isInquiryStatus('new'), true);
  assert.equal(isInquiryStatus('not-real'), false);

  console.log('cms-inquiry-service.test.ts passed');
}
