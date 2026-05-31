import type { ValidInquiryInput } from '@/lib/inquiries/validate-inquiry';

export type PublicInquiryRecord = {
  id: string;
  product?: { title: string } | null;
};

export type PublicInquiryCreateArgs = {
  data: {
    name: string;
    phone: string;
    email?: string;
    message: string;
    deliveryDate?: Date;
    deliveryNotes?: string;
    productId?: string;
  };
  include: {
    product: { select: { title: true } };
  };
};

export type PublicInquiryNotificationInput = {
  inquiryId: string;
  productTitle?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  message: string;
};

type PublicInquiryRepository = {
  create(args: PublicInquiryCreateArgs): Promise<PublicInquiryRecord>;
};

export type PublicInquiryServiceDeps = {
  inquiryRepository: PublicInquiryRepository;
  notifyNewInquiry: (input: PublicInquiryNotificationInput) => Promise<unknown>;
};

export function createPublicInquiryService(deps: PublicInquiryServiceDeps) {
  return {
    async createInquiry(input: { productId?: string; inquiry: ValidInquiryInput }) {
      const inquiry = await deps.inquiryRepository.create({
        data: {
          name: input.inquiry.name,
          phone: input.inquiry.phone,
          email: input.inquiry.email,
          message: input.inquiry.message,
          deliveryDate: input.inquiry.deliveryDate,
          deliveryNotes: input.inquiry.deliveryNotes,
          productId: input.productId
        },
        include: {
          product: { select: { title: true } }
        }
      });

      await deps.notifyNewInquiry({
        inquiryId: inquiry.id,
        productTitle: inquiry.product?.title,
        customerName: input.inquiry.name,
        customerPhone: input.inquiry.phone,
        customerEmail: input.inquiry.email,
        message: input.inquiry.message
      });

      return inquiry;
    }
  };
}
