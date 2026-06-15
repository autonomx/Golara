import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const migration = readFileSync('prisma/migrations/20260615100000_add_customer_wallet_ledger/migration.sql', 'utf8');
const service = readFileSync('lib/checkout/customer-wallet-ledger.ts', 'utf8');
const action = readFileSync('app/admin/payments/wallets/actions.ts', 'utf8');
const page = readFileSync('app/admin/payments/wallets/page.tsx', 'utf8');

for (const table of ['CustomerWalletBalance', 'CustomerWalletLedgerEntry']) {
  assert.ok(migration.includes(`CREATE TABLE IF NOT EXISTS "${table}"`), `Expected migration to create ${table}.`);
}

for (const fragment of [
  'CONSTRAINT "CustomerWalletBalance_available_nonnegative" CHECK ("availableBalanceCents" >= 0)',
  'CONSTRAINT "CustomerWalletBalance_reserved_nonnegative" CHECK ("reservedBalanceCents" >= 0)',
  'CONSTRAINT "CustomerWalletLedgerEntry_amount_positive" CHECK ("amountCents" > 0)',
  'CREATE UNIQUE INDEX IF NOT EXISTS "CustomerWalletLedgerEntry_idempotencyKey_key"',
  'FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id")'
]) {
  assert.ok(migration.includes(fragment), `Expected wallet migration safety fragment: ${fragment}`);
}

for (const fragment of [
  'CUSTOMER_WALLET_ENTRY_TYPES',
  'postCustomerWalletAdminAdjustment',
  'SELECT "id" FROM "CustomerProfile" WHERE "id" = ${adjustment.customerId} LIMIT 1',
  'WHERE "idempotencyKey" = ${adjustment.idempotencyKey}',
  'FOR UPDATE',
  'if (nextAvailable < 0) throw new Error(\'Wallet debit exceeds available balance.\');',
  'recordAdminAuditLog({',
  'action: `customer.wallet.${adjustment.direction}`'
]) {
  assert.ok(service.includes(fragment), `Expected wallet service safety fragment: ${fragment}`);
}

assert.ok(action.includes("await assertAdminRole('owner')"), 'Expected wallet adjustments to require owner role.');
assert.ok(action.includes('postCustomerWalletAdminAdjustment({'), 'Expected admin action to post wallet adjustment through the ledger service.');
assert.ok(action.includes("revalidatePath('/admin/payments/wallets')"), 'Expected admin action to revalidate the wallet page.');

for (const fragment of [
  'listCustomerWalletSummaries()',
  '<WalletAdjustmentForm />',
  'Wallet ledger',
  'formatMinorUnitAmount(wallet.availableBalanceCents, wallet.currency)',
  'formatMinorUnitAmount(wallet.reservedBalanceCents, wallet.currency)'
]) {
  assert.ok(page.includes(fragment), `Expected wallet admin page fragment: ${fragment}`);
}

console.log('customer wallet ledger source guard passed');
