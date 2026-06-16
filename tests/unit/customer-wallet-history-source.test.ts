import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const accountHistorySource = readFileSync('lib/checkout/customer-wallet-account-history.ts', 'utf8');
const walletPageSource = readFileSync('app/account/wallet/page.tsx', 'utf8');
const accountPageSource = readFileSync('app/account/page.tsx', 'utf8');

for (const fragment of [
  'getCustomerWalletAccountHistory',
  'listCustomerWalletLedger(normalizedCustomerId, normalizedCurrency, boundedLimit)',
  'FROM "CustomerWalletBalance"',
  'WHERE "customerId" = ${normalizedCustomerId} AND "currency" = ${normalizedCurrency}',
  'isMissingWalletTable(error)',
  'return { balance: null, entries: [] }'
]) {
  assert.ok(accountHistorySource.includes(fragment), `Expected customer wallet history read model to include: ${fragment}`);
}

for (const fragment of [
  'getCustomerSessionCookie()',
  'getCustomerSession(token)',
  "redirect('/account?status=session-required')",
  'getCustomerWalletAccountHistory(session.customer.id,',
  'formatMinorUnitAmount(balance?.availableBalanceCents ?? 0',
  'history.entries.map((entry) =>',
  'walletEntryMetadataObject(entry.metadata)',
  'کیف پول و اعتبار فروشگاه',
  'Wallet and store credit'
]) {
  assert.ok(walletPageSource.includes(fragment), `Expected customer wallet page to include: ${fragment}`);
}

assert.ok(accountPageSource.includes('href="/account/wallet"'), 'Expected account overview to link to wallet history.');
assert.ok(accountPageSource.includes('walletLinkLabel(locale)'), 'Expected account overview to use locale-aware wallet link label.');

console.log('customer wallet history source guard passed');
