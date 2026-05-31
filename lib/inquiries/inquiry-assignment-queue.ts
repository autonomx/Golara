import type { AdminIdentity } from '@/lib/admin-auth-core';
import type { CustomerInquiry } from '@/lib/catalog';
import { getInquiryAssigneeLabel, isInquiryAssigned } from '@/lib/inquiries/inquiry-assignment';

export type InquiryAssignmentQueueKey = 'mine' | 'assigned' | 'unassigned';

export type InquiryAssignmentQueueItem = {
  key: InquiryAssignmentQueueKey;
  label: string;
  description: string;
  count: number;
};

export type InquiryAssignmentQueueSummary = {
  total: number;
  mine: number;
  assigned: number;
  unassigned: number;
  queues: InquiryAssignmentQueueItem[];
};

function normalizeIdentityValue(value: string | undefined) {
  return value?.trim().toLowerCase() || undefined;
}

export function inquiryAssignedToIdentity(inquiry: CustomerInquiry, identity: AdminIdentity | undefined) {
  if (!identity?.authenticated) return false;

  const assignee = inquiry.assignee;
  const identityEmail = normalizeIdentityValue(identity.email);
  const identityLabel = normalizeIdentityValue(identity.label);
  const assigneeAdminId = normalizeIdentityValue(assignee?.adminId);
  const assigneeEmail = normalizeIdentityValue(assignee?.email);
  const assigneeLabel = normalizeIdentityValue(assignee?.label);

  return Boolean(
    (identityEmail && (assigneeEmail === identityEmail || assigneeAdminId === identityEmail)) ||
      (identityLabel && (assigneeLabel === identityLabel || assigneeAdminId === identityLabel))
  );
}

export function getInquiryAssignmentQueueKey(inquiry: CustomerInquiry, identity?: AdminIdentity): InquiryAssignmentQueueKey {
  if (inquiryAssignedToIdentity(inquiry, identity)) return 'mine';
  return isInquiryAssigned(inquiry.assignee) ? 'assigned' : 'unassigned';
}

export function getInquiryAssignmentQueueLabel(inquiry: CustomerInquiry, identity?: AdminIdentity) {
  const queue = getInquiryAssignmentQueueKey(inquiry, identity);
  if (queue === 'mine') return 'Assigned to me';
  if (queue === 'assigned') return `Assigned to ${getInquiryAssigneeLabel(inquiry.assignee)}`;
  return 'Unassigned';
}

export function filterInquiriesByAssignmentQueue(inquiries: CustomerInquiry[], queue: InquiryAssignmentQueueKey | 'all', identity?: AdminIdentity) {
  if (queue === 'all') return inquiries;
  return inquiries.filter((inquiry) => getInquiryAssignmentQueueKey(inquiry, identity) === queue);
}

export function createInquiryAssignmentQueueSummary(inquiries: CustomerInquiry[], identity?: AdminIdentity): InquiryAssignmentQueueSummary {
  const mine = inquiries.filter((inquiry) => inquiryAssignedToIdentity(inquiry, identity)).length;
  const assigned = inquiries.filter((inquiry) => !inquiryAssignedToIdentity(inquiry, identity) && isInquiryAssigned(inquiry.assignee)).length;
  const unassigned = inquiries.filter((inquiry) => !isInquiryAssigned(inquiry.assignee)).length;

  return {
    total: inquiries.length,
    mine,
    assigned,
    unassigned,
    queues: [
      {
        key: 'mine',
        label: 'Mine',
        description: 'Inquiries assigned to the signed-in admin identity.',
        count: mine
      },
      {
        key: 'assigned',
        label: 'Assigned',
        description: 'Inquiries owned by another staff member or role.',
        count: assigned
      },
      {
        key: 'unassigned',
        label: 'Unassigned',
        description: 'Inquiries that still need an owner.',
        count: unassigned
      }
    ]
  };
}
