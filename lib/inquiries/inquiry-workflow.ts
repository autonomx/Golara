import type { InquiryStatus } from '@/lib/cms/inquiry-service-core';

export type InquiryWorkflowStep = {
  status: InquiryStatus;
  label: string;
  description: string;
  recommendedAction: string;
  terminal: boolean;
};

export const inquiryWorkflowSteps: InquiryWorkflowStep[] = [
  {
    status: 'new',
    label: 'New',
    description: 'Customer request has arrived and still needs first staff review.',
    recommendedAction: 'Review the request, confirm contact details, and choose the first outreach channel.',
    terminal: false
  },
  {
    status: 'contacted',
    label: 'Contacted',
    description: 'Staff has reached out and is waiting for customer confirmation or details.',
    recommendedAction: 'Record each outreach attempt and move to confirmed once scope, timing, and next step are clear.',
    terminal: false
  },
  {
    status: 'confirmed',
    label: 'Confirmed',
    description: 'Customer intent is confirmed and staff can coordinate fulfillment.',
    recommendedAction: 'Coordinate preparation, delivery timing, and any manual payment or offline handoff.',
    terminal: false
  },
  {
    status: 'fulfilled',
    label: 'Fulfilled',
    description: 'Request has been completed.',
    recommendedAction: 'No active follow-up is required unless the customer reopens the request.',
    terminal: true
  },
  {
    status: 'cancelled',
    label: 'Cancelled',
    description: 'Request will not proceed.',
    recommendedAction: 'Keep the reason in staff notes or the follow-up timeline for audit context.',
    terminal: true
  }
];

export function getInquiryWorkflowStep(status: string) {
  return inquiryWorkflowSteps.find((step) => step.status === status) ?? inquiryWorkflowSteps[0];
}

export function isTerminalInquiryStatus(status: string) {
  return getInquiryWorkflowStep(status).terminal;
}

export function getInquiryRecommendedAction(status: string) {
  return getInquiryWorkflowStep(status).recommendedAction;
}

export function getInquiryWorkflowSummary(statusCounts: Array<{ status: string; count: number }>) {
  const active = statusCounts.reduce((sum, item) => (isTerminalInquiryStatus(item.status) ? sum : sum + item.count), 0);
  const closed = statusCounts.reduce((sum, item) => (isTerminalInquiryStatus(item.status) ? sum + item.count : sum), 0);
  const needsFirstReview = statusCounts.find((item) => item.status === 'new')?.count ?? 0;
  const waitingOnCustomer = statusCounts.find((item) => item.status === 'contacted')?.count ?? 0;
  const readyToFulfill = statusCounts.find((item) => item.status === 'confirmed')?.count ?? 0;

  return {
    active,
    closed,
    needsFirstReview,
    waitingOnCustomer,
    readyToFulfill
  };
}
