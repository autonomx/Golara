'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { collectInstallmentScheduleEntry, type InstallmentCollectionOutcome } from '@/lib/checkout/installment-collection';
import { reviewInstallmentPaymentAttempt, type InstallmentReviewOutcome } from '@/lib/checkout/installment-review';
import { createInstallmentScheduleForApprovedAttempt } from '@/lib/checkout/installment-schedule-foundation';

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

function optionalDateValue(formData: FormData, key: string) {
  const raw = textValue(formData, key);
  if (!raw) return undefined;
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) ? parsed : undefined;
}

function parseOutcome(value: string): InstallmentReviewOutcome {
  if (value === 'approved' || value === 'rejected' || value === 'needs_follow_up') return value;
  throw new Error('Unsupported installment review outcome.');
}

function parseCollectionOutcome(value: string): InstallmentCollectionOutcome {
  if (value === 'paid' || value === 'failed' || value === 'waived') return value;
  throw new Error('Unsupported installment collection outcome.');
}

function statusForOutcome(outcome: InstallmentReviewOutcome, scheduleCreated: boolean) {
  if (outcome === 'approved') return scheduleCreated ? 'installment-approved-scheduled' : 'installment-approved';
  if (outcome === 'rejected') return 'installment-rejected';
  return 'installment-follow-up';
}

function statusForCollectionOutcome(outcome: InstallmentCollectionOutcome) {
  if (outcome === 'paid') return 'installment-collection-paid';
  if (outcome === 'waived') return 'installment-collection-waived';
  return 'installment-collection-failed';
}

export async function reviewInstallmentAction(formData: FormData) {
  const admin = await assertAdminRole('owner');
  const orderId = textValue(formData, 'orderId');
  const paymentAttemptId = textValue(formData, 'paymentAttemptId');
  const outcome = parseOutcome(textValue(formData, 'outcome'));
  if (!orderId || !paymentAttemptId) throw new Error('Order and payment attempt are required.');

  const reviewed = await reviewInstallmentPaymentAttempt(orderId, paymentAttemptId, {
    outcome,
    approvedTermMonths: optionalNumberValue(formData, 'approvedTermMonths'),
    downPaymentCents: optionalNumberValue(formData, 'downPaymentCents'),
    note: optionalTextValue(formData, 'note'),
    actorLabel: admin.label,
    actorRole: admin.role
  });

  let schedulePlanId: string | null = null;
  let scheduleEntryCount: number | null = null;
  if (outcome === 'approved') {
    const schedule = await createInstallmentScheduleForApprovedAttempt({
      orderId,
      paymentAttemptId,
      firstDueAt: optionalDateValue(formData, 'firstDueAt'),
      actorLabel: admin.label,
      actorRole: admin.role
    });
    schedulePlanId = schedule.plan?.id ?? null;
    scheduleEntryCount = schedule.entries.length;
  }

  await recordAdminAuditLog({
    action: 'payment.installment.review',
    entity: 'checkoutPaymentAttempt',
    entityId: paymentAttemptId,
    summary: `Installment request for order ${reviewed.order.orderNumber} marked ${outcome}.`,
    metadata: {
      orderId,
      outcome,
      approvedTermMonths: reviewed.approvedTermMonths ?? null,
      downPaymentCents: reviewed.downPaymentCents ?? null,
      schedulePlanId,
      scheduleEntryCount,
      noteAdded: Boolean(optionalTextValue(formData, 'note'))
    }
  });

  revalidatePath('/admin/payments/installments');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/payments/installments?status=${statusForOutcome(outcome, Boolean(schedulePlanId))}`);
}

export async function collectInstallmentScheduleEntryAction(formData: FormData) {
  const admin = await assertAdminRole('staff');
  const entryId = textValue(formData, 'entryId');
  const outcome = parseCollectionOutcome(textValue(formData, 'outcome'));
  if (!entryId) throw new Error('Installment schedule entry is required.');

  const collected = await collectInstallmentScheduleEntry({
    entryId,
    outcome,
    collectedAmountCents: optionalNumberValue(formData, 'collectedAmountCents'),
    providerReference: optionalTextValue(formData, 'providerReference'),
    note: optionalTextValue(formData, 'note'),
    actorLabel: admin.label,
    actorRole: admin.role
  });

  await recordAdminAuditLog({
    action: 'payment.installment.collection',
    entity: 'installmentPaymentScheduleEntry',
    entityId: entryId,
    summary: `Installment payment ${collected.sequence} for order ${collected.orderNumber} marked ${outcome}.`,
    metadata: {
      orderId: collected.orderId,
      paymentAttemptId: collected.paymentAttemptId,
      planId: collected.planId,
      sequence: collected.sequence,
      outcome,
      nextPlanStatus: collected.nextPlanStatus,
      collectedAmountCents: collected.collectedAmountCents ?? null,
      providerReference: collected.providerReference ?? null,
      noteAdded: Boolean(optionalTextValue(formData, 'note'))
    }
  });

  revalidatePath('/admin/payments/installments');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${collected.orderId}`);
  redirect(`/admin/payments/installments?status=${statusForCollectionOutcome(outcome)}`);
}
