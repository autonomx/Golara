'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminActionSession } from '@/lib/admin-action-auth-boundary';
import { recordAdminAuditLog } from '@/lib/cms/catalog-repository';
import { reviewInstallmentPaymentAttempt, type InstallmentReviewOutcome } from '@/lib/checkout/installment-review';

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalTextValue(formData: FormData, key: string) {
  return textValue(formData, key) || undefined;
}

function optionalNumberValue(formData: FormData, key: string) {
  const raw = textValue(formData, key);
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOutcome(value: string): InstallmentReviewOutcome {
  if (value === 'approved' || value === 'rejected' || value === 'needs_follow_up') return value;
  throw new Error('Unsupported installment review outcome.');
}

export async function reviewInstallmentAction(formData: FormData) {
  const admin = await requireAdminActionSession();
  if (admin.role !== 'owner') throw new Error('Only owners can review installment requests.');

  const orderId = textValue(formData, 'orderId');
  const paymentAttemptId = textValue(formData, 'paymentAttemptId');
  const outcome = parseOutcome(textValue(formData, 'outcome'));
  if (!orderId || !paymentAttemptId) throw new Error('Order and payment attempt are required.');

  const reviewed = await reviewInstallmentPaymentAttempt(orderId, paymentAttemptId, {
    outcome,
    approvedTermMonths: optionalNumberValue(formData, 'approvedTermMonths'),
    downPaymentCents: optionalNumberValue(formData, 'downPaymentCents'),
    note: optionalTextValue(formData, 'note'),
    actorLabel: admin.label ?? admin.email,
    actorRole: admin.role
  });

  await recordAdminAuditLog({
    action: 'payment.installment.review',
    entity: 'checkoutPaymentAttempt',
    entityId: paymentAttemptId,
    summary: `Installment request for order ${reviewed.order.orderNumber} marked ${outcome}.`,
    actor: admin
  });

  revalidatePath('/admin/payments/installments');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, outcome };
}
