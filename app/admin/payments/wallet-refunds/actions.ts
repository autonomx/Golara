'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { refundCheckoutPaymentToCustomerWallet } from '@/lib/checkout/customer-wallet-refund';

function stringFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalIntegerFormValue(formData: FormData, name: string) {
  const value = stringFormValue(formData, name);
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be an integer minor-unit value.`);
  return parsed;
}

export async function refundPaymentToWalletAction(formData: FormData) {
  const actor = await assertAdminRole('owner');
  const paymentAttemptId = stringFormValue(formData, 'paymentAttemptId');
  const amountCents = optionalIntegerFormValue(formData, 'amountCents');
  const idempotencyKey = stringFormValue(formData, 'idempotencyKey');
  const note = stringFormValue(formData, 'note');

  const result = await refundCheckoutPaymentToCustomerWallet({
    paymentAttemptId,
    amountCents,
    idempotencyKey,
    note,
    actorLabel: actor.label,
    actorRole: actor.role
  });

  await recordAdminAuditLog({
    action: 'customer.wallet.refund',
    entity: 'checkoutPaymentAttempt',
    entityId: paymentAttemptId,
    summary: 'Refund credited to customer wallet',
    metadata: {
      orderId: result.orderId,
      walletId: result.wallet.id,
      refundEntryId: result.refundEntry.id,
      amountCents: result.refundEntry.amountCents,
      currency: result.refundEntry.currency,
      idempotent: result.idempotent,
      noteAdded: Boolean(note)
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath('/admin/payments/wallets');
  revalidatePath('/admin/payments/wallet-refunds');
  redirect('/admin/payments/wallet-refunds?status=wallet-refunded');
}
