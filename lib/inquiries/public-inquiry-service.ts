import 'server-only';

import {
  createPublicInquiryService,
  type PublicInquiryCreateArgs,
  type PublicInquiryRecord
} from '@/lib/inquiries/public-inquiry-service-core';
import { notifyNewInquiry } from '@/lib/notifications/inquiry-notifications';
import { prisma } from '@/lib/prisma';

export { createPublicInquiryService } from '@/lib/inquiries/public-inquiry-service-core';

const inquiryRepository = {
  async create(args: PublicInquiryCreateArgs): Promise<PublicInquiryRecord> {
    return prisma.customerInquiry.create(args);
  }
};

export const publicInquiryService = createPublicInquiryService({
  inquiryRepository,
  notifyNewInquiry
});
