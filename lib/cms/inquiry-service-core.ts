import type { CmsAuditWriter, CmsIdentifiedRecord } from '@/lib/cms/service-types';

export type InquiryStatus = 'new' | 'contacted' | 'confirmed' | 'fulfilled' | 'cancelled';

export const inquiryStatuses: InquiryStatus[] = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];

export type CmsInquiryStatusRecord = {
  status: string;
};

export type CmsInquiryFollowUpRecord = CmsIdentifiedRecord;

export type InquiryUpdateArgs = {
  where: { id: string };
  data: { status: InquiryStatus; staffNotes: string };
};

export type InquiryFindStatusArgs = {
  where: { id: string };
  select: { status: true };
};

export type InquiryFollowUpCreateArgs = {
  data: { inquiryId: string; note: string; channel: string };
};

type InquiryRepository = {
  findUnique(args: InquiryFindStatusArgs): Promise<CmsInquiryStatusRecord | null>;
  update(args: InquiryUpdateArgs): Promise<unknown>;
};

type InquiryFollowUpRepository = {
  create(args: InquiryFollowUpCreateArgs): Promise<CmsInquiryFollowUpRecord>;
};

export type CmsInquiryServiceDeps = {
  inquiryRepository: InquiryRepository;
  followUpRepository: InquiryFollowUpRepository;
  auditWriter: CmsAuditWriter;
};

export function isInquiryStatus(value: string): value is InquiryStatus {
  return inquiryStatuses.includes(value as InquiryStatus);
}

export function createCmsInquiryService(deps: CmsInquiryServiceDeps) {
  return {
    async updateInquiry(input: { inquiryId: string; status: InquiryStatus; staffNotes: string }) {
      const currentInquiry = await deps.inquiryRepository.findUnique({
        where: { id: input.inquiryId },
        select: { status: true }
      });

      if (!currentInquiry) throw new Error('Inquiry not found.');

      await deps.inquiryRepository.update({
        where: { id: input.inquiryId },
        data: { status: input.status, staffNotes: input.staffNotes }
      });

      if (currentInquiry.status !== input.status) {
        await deps.followUpRepository.create({
          data: {
            inquiryId: input.inquiryId,
            channel: 'system',
            note: `Status changed from ${currentInquiry.status} to ${input.status}.`
          }
        });
      }

      await deps.auditWriter({
        action: 'inquiry.update',
        entity: 'customerInquiry',
        entityId: input.inquiryId,
        summary: `Updated inquiry status to ${input.status}`,
        metadata: {
          previousStatus: currentInquiry.status,
          status: input.status,
          staffNotesUpdated: Boolean(input.staffNotes)
        }
      });
    },

    async addFollowUp(input: { inquiryId: string; note: string; channel: string }) {
      const followUp = await deps.followUpRepository.create({
        data: {
          inquiryId: input.inquiryId,
          note: input.note,
          channel: input.channel
        }
      });

      await deps.auditWriter({
        action: 'inquiry.follow_up.create',
        entity: 'customerInquiry',
        entityId: input.inquiryId,
        summary: `Added ${input.channel} follow-up to inquiry`,
        metadata: { followUpId: followUp.id, channel: input.channel }
      });

      return followUp;
    }
  };
}
