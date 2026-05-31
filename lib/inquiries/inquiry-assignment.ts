import type { AdminIdentity, AdminRole } from '@/lib/admin-auth-core';
import type { CustomerInquiryAssignee } from '@/lib/catalog';

export type InquiryAssignmentInput = {
  adminId?: string;
  label?: string;
  email?: string;
  role?: string;
  assignedAt?: Date;
};

export type InquiryAssignmentActionType = 'assign-to-me' | 'assign-to-role' | 'unassign';

export type InquiryAssignmentActionPayload = {
  type: InquiryAssignmentActionType;
  role?: AdminRole;
};

const assignmentActionTypes: InquiryAssignmentActionType[] = ['assign-to-me', 'assign-to-role', 'unassign'];

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeRole(value: string | undefined): AdminRole | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'owner' || normalized === 'staff' ? normalized : undefined;
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

export function createInquiryAssigneeForRole(role: AdminRole, assignedAt = new Date()): CustomerInquiryAssignee {
  return {
    adminId: `role:${role}`,
    label: role === 'owner' ? 'Owner queue' : 'Staff queue',
    role,
    assignedAt
  };
}

export function parseInquiryAssignmentActionPayload(input: { action?: string; role?: string }): InquiryAssignmentActionPayload {
  const action = normalizeOptionalString(input.action)?.toLowerCase() as InquiryAssignmentActionType | undefined;
  if (!action || !assignmentActionTypes.includes(action)) return { type: 'assign-to-me' };

  if (action === 'assign-to-role') {
    return { type: action, role: normalizeRole(input.role) ?? 'staff' };
  }

  return { type: action };
}

export function getInquiryAssigneeLabel(assignee: CustomerInquiryAssignee | undefined) {
  return assignee?.label || assignee?.email || assignee?.adminId || 'Unassigned';
}

export function isInquiryAssigned(assignee: CustomerInquiryAssignee | undefined) {
  return Boolean(assignee?.adminId || assignee?.label || assignee?.email || assignee?.role || assignee?.assignedAt);
}

export function describeInquiryAssignmentChange(previousAssignee: CustomerInquiryAssignee | undefined, nextAssignee: CustomerInquiryAssignee | undefined) {
  const previousLabel = getInquiryAssigneeLabel(previousAssignee);
  const nextLabel = getInquiryAssigneeLabel(nextAssignee);

  if (!isInquiryAssigned(nextAssignee)) {
    return `Assignment cleared from ${previousLabel}.`;
  }

  if (!isInquiryAssigned(previousAssignee)) {
    return `Assignment set to ${nextLabel}.`;
  }

  return `Assignment changed from ${previousLabel} to ${nextLabel}.`;
}
