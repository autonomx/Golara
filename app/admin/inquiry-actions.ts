'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminAuthenticated } from '@/lib/admin-auth';
import { hasDatabase, prisma } from '@/lib/prisma';

const allowedStatuses = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];

function adminStatus(status: string) {
  return `/admin?status=${encodeURIComponent(status)}`;
}

export async function saveInquiryAction(inquiryId: string, formData: FormData) {
  await assertAdminAuthenticated();
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const statusValue = formData.get('status');
  const notesValue = formData.get('staffNotes');
  const status = typeof statusValue === 'string' ? statusValue : 'new';
  const staffNotes = typeof notesValue === 'string' ? notesValue.trim() : '';

  if (!allowedStatuses.includes(status)) throw new Error('Invalid inquiry status.');

  await prisma.customerInquiry.update({
    where: { id: inquiryId },
    data: { status, staffNotes }
  });

  revalidatePath('/admin');
  redirect(adminStatus('inquiry-updated'));
}

export async function addInquiryFollowUpAction(inquiryId: string, formData: FormData) {
  await assertAdminAuthenticated();
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const noteValue = formData.get('note');
  const channelValue = formData.get('channel');
  const note = typeof noteValue === 'string' ? noteValue.trim() : '';
  const channel = typeof channelValue === 'string' && channelValue.trim() ? channelValue.trim() : 'internal';

  if (note.length < 2) throw new Error('Follow-up note is required.');

  await prisma.customerInquiryFollowUp.create({
    data: { inquiryId, note, channel }
  });

  revalidatePath('/admin');
  redirect(adminStatus('follow-up-added'));
}
