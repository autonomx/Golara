'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { cmsInquiryService, isInquiryStatus } from '@/lib/cms/inquiry-service';
import {
  createInquiryAssigneeForRole,
  createInquiryAssigneeFromAdminIdentity,
  parseInquiryAssignmentActionPayload
} from '@/lib/inquiries/inquiry-assignment';
import { parseInquiryAssignmentQueueFilter } from '@/lib/inquiries/inquiry-assignment-queue';
import { hasDatabase } from '@/lib/prisma';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';

function stringFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function adminStatus(status: string, formData: FormData) {
  const params = new URLSearchParams({ status });
  const inquiryStatus = stringFormValue(formData, 'returnInquiryStatus');
  const inquirySearch = stringFormValue(formData, 'returnInquirySearch');
  const inquiryPage = stringFormValue(formData, 'returnInquiryPage');
  const inquiryAssignment = parseInquiryAssignmentQueueFilter(stringFormValue(formData, 'returnInquiryAssignment'));

  if (inquiryStatus) params.set('inquiryStatus', inquiryStatus);
  if (inquirySearch) params.set('inquirySearch', inquirySearch);
  if (inquiryPage && inquiryPage !== '1') params.set('inquiryPage', inquiryPage);
  if (inquiryAssignment !== 'all') params.set('inquiryAssignment', inquiryAssignment);

  return `/admin/inquiries?${params.toString()}`;
}

export async function saveInquiryAction(inquiryId: string, formData: FormData) {
  // Enforce same-origin policy for admin inquiry actions to prevent CSRF attacks
  await assertSameOriginServerAction();
  await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const status = stringFormValue(formData, 'status') || 'new';
  const staffNotes = stringFormValue(formData, 'staffNotes');

  if (!isInquiryStatus(status)) throw new Error('Invalid inquiry status.');

  await cmsInquiryService.updateInquiry({ inquiryId, status, staffNotes });

  revalidatePath('/admin');
  revalidatePath('/admin/inquiries');
  redirect(adminStatus('inquiry-updated', formData));
}

export async function assignInquiryAction(inquiryId: string, formData: FormData) {
  // Enforce same-origin policy for admin inquiry actions to prevent CSRF attacks
  await assertSameOriginServerAction();
  const identity = await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const payload = parseInquiryAssignmentActionPayload({
    action: stringFormValue(formData, 'assignmentAction'),
    role: stringFormValue(formData, 'assignmentRole')
  });

  const assignee = payload.type === 'unassign'
    ? undefined
    : payload.type === 'assign-to-role'
      ? createInquiryAssigneeForRole(payload.role ?? 'staff')
      : createInquiryAssigneeFromAdminIdentity(identity);

  if (payload.type !== 'unassign' && !assignee) throw new Error('Unable to resolve inquiry assignee.');

  await cmsInquiryService.assignInquiry({ inquiryId, assignee });

  revalidatePath('/admin');
  revalidatePath('/admin/inquiries');
  redirect(adminStatus(payload.type === 'unassign' ? 'inquiry-unassigned' : 'inquiry-assigned', formData));
}

export async function addInquiryFollowUpAction(inquiryId: string, formData: FormData) {
  // Enforce same-origin policy for admin inquiry actions to prevent CSRF attacks
  await assertSameOriginServerAction();
  await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const note = stringFormValue(formData, 'note');
  const channel = stringFormValue(formData, 'channel') || 'internal';

  if (note.length < 2) throw new Error('Follow-up note is required.');

  await cmsInquiryService.addFollowUp({ inquiryId, note, channel });

  revalidatePath('/admin');
  revalidatePath('/admin/inquiries');
  redirect(adminStatus('follow-up-added', formData));
}
