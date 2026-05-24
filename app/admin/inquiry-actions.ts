'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminAuthenticated } from '@/lib/admin-auth';
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
  await assertAdminAuthenticated();
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const status = stringFormValue(formData, 'status') || 'new';
  const staffNotes = stringFormValue(formData, 'staffNotes');

  if (!allowedStatuses.includes(status)) throw new Error('Invalid inquiry status.');

  await prisma.customerInquiry.update({
    where: { id: inquiryId },
    data: { status, staffNotes }
  });

  revalidatePath('/admin');
  redirect(adminStatus('inquiry-updated', formData));
}

export async function addInquiryFollowUpAction(inquiryId: string, formData: FormData) {
  await assertAdminAuthenticated();
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const note = stringFormValue(formData, 'note');
  const channel = stringFormValue(formData, 'channel') || 'internal';

  if (note.length < 2) throw new Error('Follow-up note is required.');

  await prisma.customerInquiryFollowUp.create({
    data: { inquiryId, note, channel }
  });

  revalidatePath('/admin');
  redirect(adminStatus('follow-up-added', formData));
}
