'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminAuthenticated } from '@/lib/admin-auth';
import { hasDatabase, prisma } from '@/lib/prisma';

const allowedStatuses = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];

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
  redirect('/admin?status=inquiry-updated');
}
