import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import {
  createCmsInquiryService,
  type CmsInquiryFollowUpRecord,
  type CmsInquiryStatusRecord,
  type CmsInquiryAssignmentRecord,
  type InquiryAssignmentUpdateArgs,
  type InquiryFindAssignmentArgs,
  type InquiryFindStatusArgs,
  type InquiryFollowUpCreateArgs,
  type InquiryUpdateArgs
} from '@/lib/cms/inquiry-service-core';
import { prisma } from '@/lib/prisma';

export { createCmsInquiryService, inquiryStatuses, isInquiryStatus } from '@/lib/cms/inquiry-service-core';

const inquiryRepository = {
  async findUnique(args: InquiryFindStatusArgs | InquiryFindAssignmentArgs): Promise<CmsInquiryStatusRecord | CmsInquiryAssignmentRecord | null> {
    return prisma.customerInquiry.findUnique(args);
  },
  async update(args: InquiryUpdateArgs | InquiryAssignmentUpdateArgs): Promise<unknown> {
    return prisma.customerInquiry.update(args);
  }
};

const followUpRepository = {
  async create(args: InquiryFollowUpCreateArgs): Promise<CmsInquiryFollowUpRecord> {
    return prisma.customerInquiryFollowUp.create(args);
  }
};

export const cmsInquiryService = createCmsInquiryService({
  inquiryRepository,
  followUpRepository,
  auditWriter: recordAdminAuditLog
});
