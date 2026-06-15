'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { MANUAL_TRANSFER_VERIFICATION_OUTCOMES, verifyManualTransferPaymentAttempt, type ManualTransferVerificationOutcome } from '@/lib/checkout/manual-transfer-verification';

function stringFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function integerFormValue(formData: FormData, name: string, fallback = 0) {
  const parsed = Number.parseInt(stringFormValue(formData, name), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function assertManualTransferOutcome(value: string): ManualTransferVerificationOutcome {
  if (MANUAL_TRANSFER_VERIFICATION_OUTCOMES.includes(value as ManualTransferVerificationOutcome)) {
    return value as ManualTransferVerificationOutcome;
  }
  throw new Error(`Unknown manual transfer verification outcome: ${value}`);
}

function statusForOutcome(outcome: ManualTransferVerificationOutcome) {
  if (outcome === 'received') return 'manual-transfer-received';
  if (outcome === 'rejected') return 'manual-transfer-rejected';
  return 'manual-transfer-follow-up';
}

export async function verifyManualTransferPaymentAction(orderId: string, paymentAttemptId: string, formData: FormData) {
  const actor = await assertAdminRole('owner');
  const outcome = assertManualTransferOutcome(stringFormValue(formData, 'outcome'));
  const receivedAmountCents = integerFormValue(formData, 'receivedAmountCents', 0);
  const providerReference = stringFormValue(formData, 'providerReference');
  const note = stringFormValue(formData, 'note');

  const result = await verifyManualTransferPaymentAttempt(orderId, paymentAttemptId, {
    outcome,
    receivedAmountCents,
    providerReference,
    note,
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: `order.payment.manual_transfer.${outcome}`,
    entity: 'checkoutOrder',
    entityId: orderId,
    summary: `Manual transfer verification ${outcome} for order ${result.order.orderNumber}`,
    metadata: {
      paymentAttemptId,
      outcome,
      receivedAmountCents: result.receivedAmountCents,
      providerReference: result.providerReference ?? null,
      noteAdded: Boolean(note)
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath('/admin/payments/manual-transfer');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/payments/manual-transfer?status=${statusForOutcome(outcome)}`);
}
