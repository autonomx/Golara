'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { postCustomerWalletAdminAdjustment } from '@/lib/checkout/customer-wallet-ledger';

function stringFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function integerFormValue(formData: FormData, name: string) {
  const parsed = Number.parseInt(stringFormValue(formData, name), 10);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid integer value for ${name}.`);
  return parsed;
}

function adjustmentStatus(direction: string) {
  return direction === 'debit' ? 'wallet-debited' : 'wallet-credited';
}

export async function adjustCustomerWalletAction(formData: FormData) {
  const actor = await assertAdminRole('owner');
  const customerId = stringFormValue(formData, 'customerId');
  const direction = stringFormValue(formData, 'direction');
  const currency = stringFormValue(formData, 'currency') || 'TOMAN';
  const amountCents = integerFormValue(formData, 'amountCents');
  const note = stringFormValue(formData, 'note');
  const idempotencyKey = stringFormValue(formData, 'idempotencyKey') || undefined;

  if (direction !== 'credit' && direction !== 'debit') {
    throw new Error(`Unsupported wallet adjustment direction: ${direction}`);
  }

  await postCustomerWalletAdminAdjustment({
    customerId,
    direction,
    currency,
    amountCents,
    note,
    idempotencyKey,
    actorLabel: actor.label,
    actorRole: actor.role,
    metadata: {
      source: 'admin_wallet_adjustment_action'
    }
  });

  revalidatePath('/admin/payments/wallets');
  revalidatePath('/admin/customers');
  redirect(`/admin/payments/wallets?status=${adjustmentStatus(direction)}`);
}
