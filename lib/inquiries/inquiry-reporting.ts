import type { CustomerInquiry, CustomerInquiryFollowUp } from '@/lib/catalog';
import { getInquiryWorkflowStep } from '@/lib/inquiries/inquiry-workflow';

export type InquiryReportRow = {
  createdAt: Date;
  status: string;
  statusLabel: string;
  productTitle: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryDate?: Date;
  deliveryNotes: string;
  message: string;
  staffNotes: string;
  followUpCount: number;
  latestFollowUpChannel: string;
  latestFollowUpAt?: Date;
  latestFollowUpNote: string;
  recommendedAction: string;
};

function text(value: string | undefined) {
  return value?.trim() || '';
}

export function getLatestInquiryFollowUp(inquiry: CustomerInquiry): CustomerInquiryFollowUp | undefined {
  return [...(inquiry.followUps ?? [])].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
}

export function createInquiryReportRow(inquiry: CustomerInquiry): InquiryReportRow {
  const workflowStep = getInquiryWorkflowStep(inquiry.status);
  const latestFollowUp = getLatestInquiryFollowUp(inquiry);

  return {
    createdAt: inquiry.createdAt,
    status: inquiry.status,
    statusLabel: workflowStep.label,
    productTitle: text(inquiry.productTitle) || 'General inquiry',
    customerName: text(inquiry.name),
    phone: text(inquiry.phone),
    email: text(inquiry.email),
    deliveryDate: inquiry.deliveryDate,
    deliveryNotes: text(inquiry.deliveryNotes),
    message: inquiry.message,
    staffNotes: text(inquiry.staffNotes),
    followUpCount: inquiry.followUps?.length ?? 0,
    latestFollowUpChannel: latestFollowUp?.channel ?? '',
    latestFollowUpAt: latestFollowUp?.createdAt,
    latestFollowUpNote: latestFollowUp?.note ?? '',
    recommendedAction: workflowStep.recommendedAction
  };
}

export function createInquiryReportRows(inquiries: CustomerInquiry[]) {
  return inquiries.map(createInquiryReportRow);
}

export function createInquiryReportSummary(inquiries: CustomerInquiry[]) {
  const rows = createInquiryReportRows(inquiries);
  return {
    total: rows.length,
    withFollowUps: rows.filter((row) => row.followUpCount > 0).length,
    withoutFollowUps: rows.filter((row) => row.followUpCount === 0).length,
    needsFirstReview: rows.filter((row) => row.status === 'new').length,
    waitingOnCustomer: rows.filter((row) => row.status === 'contacted').length,
    readyToFulfill: rows.filter((row) => row.status === 'confirmed').length
  };
}
