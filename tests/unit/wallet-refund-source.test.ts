import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serviceSource = readFileSync('lib/checkout/customer-wallet-refund.ts', 'utf8');
const actionSource = readFileSync('app/admin/payments/wallet-refunds/actions.ts', 'utf8');
const pageSource = readFileSync('app/admin/payments/wallet-refunds/page.tsx', 'utf8');

for (const fragment of [
  'export async function refundCheckoutPaymentToCustomerWallet',
  'FOR UPDATE',
  "'refund_credit'",
  "'credit'",
  "'posted'",
  'walletRefundEntryId',
  'walletRefundIdempotencyKey',
  'walletRefundTotalCents',
  "status: nextRefundTotalCents >= attempt.amountCents ? 'refunded' : attempt.status",
  "type: 'wallet_refund_credited'",
  'Wallet refund would exceed the remaining refundable payment amount.'
]) {
  assert.ok(serviceSource.includes(fragment), `Expected wallet refund service fragment: ${fragment}`);
}

assert.ok(serviceSource.includes('WHERE "idempotencyKey" = ${refundIdempotencyKey}'), 'Expected refund idempotency lookup before creating a ledger entry.');
assert.ok(serviceSource.includes('existingRefundTotal(metadata) + refundAmountCents'), 'Expected cumulative refund tracking to prevent over-refunds.');
assert.ok(serviceSource.includes('"lifetimeCreditCents" = ${nextLifetimeCredit}'), 'Expected wallet refunds to increase lifetime credit.');
assert.ok(serviceSource.includes('INSERT INTO "CustomerWalletLedgerEntry"'), 'Expected wallet refunds to append immutable ledger entries.');

for (const fragment of [
  "await assertAdminRole('owner')",
  'refundCheckoutPaymentToCustomerWallet({',
  "action: 'customer.wallet.refund'",
  "revalidatePath('/admin/payments/wallets')",
  "revalidatePath('/admin/payments/wallet-refunds')"
]) {
  assert.ok(actionSource.includes(fragment), `Expected wallet refund action fragment: ${fragment}`);
}

for (const fragment of [
  'Wallet refunds',
  'Payment attempt ID',
  'Credit refund to wallet',
  'Wallet ledger',
  'refundPaymentToWalletAction'
]) {
  assert.ok(pageSource.includes(fragment), `Expected wallet refund page fragment: ${fragment}`);
}

console.log('wallet-refund-source.test.ts passed');
