'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

const allowedStatuses = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];

function stringFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function adminStatus(status: string, formData: FormData) {
  const params = new URLSearchParams({ status });
  const inquiryStatus = stringFormValue(formData, 'returnInquiryStatus');
  const inquirySearch = stringFormValue(formData, 'returnInquirySearch');
  const inquiryPage = stringFormValue(formData, 'returnInquiryPage');

  if (inquiryStatus) params.set('inquiryStatus', inquiryStatus);
  if (inquirySearch) params.set('inquirySearch', inquirySearch);
  if (inquiryPage && inquiryPage !== '1') params.set('inquiryPage', inquiryPage);

  return `/admin?${params.toString()}`;
}

export async function saveInquiryAction(inquiryId: string, formData: FormData) {
  await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const status = stringFormValue(formData, 'status') || 'new';
  const staffNotes = stringFormValue(formData, 'staffNotes');

  if (!allowedStatuses.includes(status)) throw new Error('Invalid inquiry status.');

  const currentInquiry = await prisma.customerInquiry.findUnique({
    where: { id: inquiryId },
    select: { status: true }
  });

  if (!currentInquiry) throw new Error('Inquiry not found.');

  await prisma.customerInquiry.update({
    where: { id: inquiryId },
    data: { status, staffNotes }
  });

  if (currentInquiry.status !== status) {
    await prisma.customerInquiryFollowUp.create({
      data: {
        inquiryId,
        channel: 'system',
        note: `Status changed from ${currentInquiry.status} to ${status}.`
      }
    });
  }

  await recordAdminAuditLog({
    action: 'inquiry.update',
    entity: 'customerInquiry',
    entityId: inquiryId,
    summary: `Updated inquiry status to ${status}`,
    metadata: {
      previousStatus: currentInquiry.status,
      status,
      staffNotesUpdated: Boolean(staffNotes)
    }
  });

  revalidatePath('/admin');
  redirect(adminStatus('inquiry-updated', formData));
}

export async function addInquiryFollowUpAction(inquiryId: string, formData: FormData) {
  await assertAdminRole('staff');
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const note = stringFormValue(formData, 'note');
  const channel = stringFormValue(formData, 'channel') || 'internal';

  if (note.length < 2) throw new Error('Follow-up note is required.');

  const followUp = await prisma.customerInquiryFollowUp.create({
    data: { inquiryId, note, channel }
  });

  await recordAdminAuditLog({
    action: 'inquiry.follow_up.create',
    entity: 'customerInquiry',
    entityId: inquiryId,
    summary: `Added ${channel} follow-up to inquiry`,
    metadata: { followUpId: followUp.id, channel }
  });

  revalidatePath('/admin');
  redirect(adminStatus('follow-up-added', formData));
}
