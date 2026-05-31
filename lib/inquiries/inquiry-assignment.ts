import type { AdminIdentity } from '@/lib/admin-auth-core';
import type { CustomerInquiryAssignee } from '@/lib/catalog';

export type InquiryAssignmentInput = {
  adminId?: string;
  label?: string;
  email?: string;
  role?: string;
  assignedAt?: Date;
};

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function normalizeInquiryAssignee(input: InquiryAssignmentInput): CustomerInquiryAssignee | undefined {
  const adminId = normalizeOptionalString(input.adminId);
  const label = normalizeOptionalString(input.label);
  const email = normalizeOptionalString(input.email);
  const role = normalizeOptionalString(input.role);
  const assignedAt = input.assignedAt;

  if (!adminId && !label && !email && !role && !assignedAt) return undefined;

  return { adminId, label, email, role, assignedAt };
}

export function createInquiryAssigneeFromAdminIdentity(identity: AdminIdentity, assignedAt = new Date()): CustomerInquiryAssignee | undefined {
  if (!identity.authenticated) return undefined;
  return normalizeInquiryAssignee({
    adminId: identity.email ?? identity.label,
    label: identity.label,
    email: identity.email,
    role: identity.role,
    assignedAt
  });
}

export function getInquiryAssigneeLabel(assignee: CustomerInquiryAssignee | undefined) {
  return assignee?.label || assignee?.email || assignee?.adminId || 'Unassigned';
}

export function isInquiryAssigned(assignee: CustomerInquiryAssignee | undefined) {
  return Boolean(assignee?.adminId || assignee?.label || assignee?.email || assignee?.assignedAt);
}
