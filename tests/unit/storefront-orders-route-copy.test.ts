import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { customerInstallmentApprovalMessage } from '@/lib/localization/customer-installment-message-copy';
import {
  customerOrderCodCollectionReminder,
  customerOrderDateLocale,
  customerOrderItemCountLabel,
  customerOrderManualTransferInstructions,
  customerOrderMethodConfirmation,
  customerOrderMoreItemLabel,
  customerOrderPaymentSummary,
  getCustomerOrderCopy,
  getCustomerOrderMethodConfirmationCopy,
  type CustomerOrderCopyKey,
  type CustomerOrderMethodConfirmationKey
} from '@/lib/localization/customer-order-copy';
import { customerWalletReceiptDetails } from '@/lib/localization/customer-wallet-receipt-copy';

const source = readFileSync('app/account/orders/page.tsx', 'utf8');
const walletSource = readFileSync('app/account/wallet/page.tsx', 'utf8');
const copySource = readFileSync('lib/localization/customer-order-copy.ts', 'utf8');
const installmentMessageCopySource = readFileSync('lib/localization/customer-installment-message-copy.ts', 'utf8');
const walletReceiptCopySource = readFileSync('lib/localization/customer-wallet-receipt-copy.ts', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected order history route source to include: ${fragment}`);
}

function walletHas(fragment: string) {
  assert.ok(walletSource.includes(fragment), `Expected wallet route source to include: ${fragment}`);
}

function copyHas(fragment: string) {
  assert.ok(copySource.includes(fragment), `Expected customer order copy source to include: ${fragment}`);
}

function installmentMessageCopyHas(fragment: string) {
  assert.ok(installmentMessageCopySource.includes(fragment), `Expected installment message copy source to include: ${fragment}`);
}

function walletReceiptCopyHas(fragment: string) {
  assert.ok(walletReceiptCopySource.includes(fragment), `Expected wallet receipt copy source to include: ${fragment}`);
}

for (const key of [
  'eyebrow',
  'title',
  'subtitle',
  'unavailableTitle',
  'unavailableBody',
  'accountOverview',
  'emptyTitle',
  'emptyBody',
  'browseProducts',
  'viewPublicStatus',
  'itemSingular',
  'itemPlural',
  'moreItemSingular',
  'moreItemPlural',
  'payment.none',
  'payment.verifiedPaid',
  'payment.redirectRequired',
  'payment.manualPending',
  'payment.failed',
  'payment.cancelled'
] as const satisfies readonly CustomerOrderCopyKey[]) {
  assert.ok(getCustomerOrderCopy(key, 'en'), `Expected English order copy for ${key}`);
  assert.ok(getCustomerOrderCopy(key, 'fa'), `Expected Persian order copy for ${key}`);
}

for (const key of [
  'gateway',
  'wallet',
  'manualTransfer',
  'installment',
  'cod'
] as const satisfies readonly CustomerOrderMethodConfirmationKey[]) {
  assert.ok(getCustomerOrderMethodConfirmationCopy(key, 'en').title, `Expected English method confirmation title for ${key}`);
  assert.ok(getCustomerOrderMethodConfirmationCopy(key, 'fa').body, `Expected Persian method confirmation body for ${key}`);
}

for (const fragment of [
  'resolveStorefrontLocale',
  'const storefrontLocale = await resolveStorefrontLocale();',
  'getCustomerCopyDirection(storefrontLocale)',
  'getCustomerOrderCopy(key, storefrontLocale)',
  '<SiteHeader locale={storefrontLocale} />',
  'const locale = session.customer.locale;',
  'getCustomerCopyDirection(locale)',
  'getCustomerOrderCopy(key, locale)',
  '<SiteHeader locale={locale} />',
  'customerOrderDateLocale(locale)',
  'customerOrderPaymentSummary(latestAttempt?.status, locale)',
  'customerOrderMethodConfirmation(metadata, locale)',
  'customerOrderManualTransferInstructions(metadata, order.orderNumber, locale)',
  'customerOrderCodCollectionReminder(metadata, order.orderNumber, locale)',
  'customerInstallmentApprovalMessage(metadata, orderNumber, locale)',
  'approvalMessage.title',
  'approvalMessage.body',
  'approvalMessage.emailSubject',
  'approvalMessage.emailBody',
  'methodConfirmation.methodLabel ?? methodConfirmation.title',
  'methodConfirmation.body',
  'manualTransferInstructions.referenceLabel',
  'manualTransferInstructions.proofUrlLabel',
  'manualTransferInstructions.emailSubject',
  'manualTransferInstructions.emailBody',
  'codCollectionReminder.statusLabel',
  'codCollectionReminder.settlementLabel',
  'codCollectionReminder.settlementReferenceLabel',
  'codCollectionReminder.emailSubject',
  'codCollectionReminder.emailBody',
  'customerOrderItemCountLabel(order.items.reduce((sum, item) => sum + item.quantity, 0), locale)',
  'customerOrderMoreItemLabel(order.items.length - 3, locale)',
  "copy('eyebrow')",
  "copy('title')",
  "copy('subtitle')",
  "copy('unavailableTitle')",
  "copy('unavailableBody')",
  "copy('accountOverview')",
  "copy('emptyTitle')",
  "copy('emptyBody')",
  "copy('browseProducts')",
  "copy('viewPublicStatus')"
]) {
  has(fragment);
}

for (const fragment of [
  'CustomerOrderManualTransferInstructions',
  'manualPaymentReference',
  'manualPaymentProofUrl',
  'manualPaymentInstructionsAcknowledged',
  'emailSubject',
  'emailBody',
  'Manual-transfer instructions',
  'راهنمای انتقال بانکی'
]) {
  copyHas(fragment);
}

for (const fragment of [
  'CustomerOrderCodCollectionReminder',
  'codPaymentSelected',
  'codRequiresDeliveryCollection',
  'codCollectionStatus',
  'codSettlementStatus',
  'codSettlementReference',
  'Cash-on-delivery reminder',
  'Please keep the delivery payment ready',
  'یادآوری پرداخت هنگام تحویل',
  'لطفاً مبلغ پرداخت هنگام تحویل را آماده نگه دارید',
  'emailSubject',
  'emailBody'
]) {
  copyHas(fragment);
}

for (const fragment of [
  'CustomerInstallmentApprovalMessage',
  'pending_review',
  'approved',
  'rejected',
  'needs_follow_up',
  'Installment request approved',
  'Installment request not approved',
  'Installment request needs follow-up',
  'درخواست اقساط تایید شد',
  'درخواست اقساط تایید نشد',
  'درخواست اقساط نیازمند پیگیری است',
  'emailSubject',
  'emailBody',
  'installmentApprovalStatus',
  'installment-credit'
]) {
  installmentMessageCopyHas(fragment);
}

for (const fragment of [
  'customerWalletReceiptDetails(entry, locale)',
  'receipt.title',
  'receipt.body',
  'receipt.statusLabel',
  'receipt.paymentAttemptLabel',
  'receipt.idempotencyLabel'
]) {
  walletHas(fragment);
}

for (const fragment of [
  'CustomerWalletReceiptDetails',
  'walletDebit',
  'walletRefund',
  'checkout_capture',
  'refund_credit',
  'walletCapturedAt',
  'refundedAt',
  'Wallet debit receipt',
  'Wallet refund receipt',
  'رسید برداشت از کیف پول',
  'رسید بازگشت وجه به کیف پول'
]) {
  walletReceiptCopyHas(fragment);
}

assert.equal(customerOrderDateLocale('en'), 'en-CA');
assert.equal(customerOrderDateLocale('fa'), 'fa-IR');
assert.equal(customerOrderItemCountLabel(1, 'en'), '1 item');
assert.equal(customerOrderItemCountLabel(2, 'en'), '2 items');
assert.ok(customerOrderItemCountLabel(2, 'fa'));
assert.equal(customerOrderMoreItemLabel(1, 'en'), '1 more item');
assert.equal(customerOrderPaymentSummary('verified_paid', 'en'), getCustomerOrderCopy('payment.verifiedPaid', 'en'));
assert.equal(customerOrderPaymentSummary('redirect_required', 'fa'), getCustomerOrderCopy('payment.redirectRequired', 'fa'));
assert.equal(customerOrderPaymentSummary(null, 'en'), getCustomerOrderCopy('payment.none', 'en'));
assert.equal(customerOrderMethodConfirmation({ paymentMethodType: 'gateway', paymentMethodLabel: 'Online card payment / Iranian IPG' }, 'en')?.key, 'gateway');
assert.equal(customerOrderMethodConfirmation({ paymentMethodKey: 'wallet-credit' }, 'en')?.title, getCustomerOrderMethodConfirmationCopy('wallet', 'en').title);
assert.equal(customerOrderMethodConfirmation({ paymentMethodType: 'manual_transfer' }, 'en')?.key, 'manualTransfer');
assert.equal(customerOrderMethodConfirmation({ paymentMethodType: 'installment' }, 'fa')?.key, 'installment');
assert.equal(customerOrderMethodConfirmation({ paymentMethodKey: 'cash-on-delivery' }, 'en')?.key, 'cod');
assert.equal(customerOrderMethodConfirmation({ paymentMethodType: 'unknown' }, 'en'), null);

const manualInstructions = customerOrderManualTransferInstructions({
  paymentMethodType: 'manual_transfer',
  manualPaymentReference: 'ABC-123',
  manualPaymentProofUrl: 'https://example.test/proof'
}, 'GOL-1001', 'en');
assert.equal(manualInstructions?.reference, 'ABC-123');
assert.equal(manualInstructions?.proofUrl, 'https://example.test/proof');
assert.ok(manualInstructions?.emailSubject.includes('GOL-1001'));
assert.ok(manualInstructions?.emailBody.includes('ABC-123'));
assert.ok(customerOrderManualTransferInstructions({ paymentMethodType: 'wallet' }, 'GOL-1002', 'en') === null);
assert.ok(customerOrderManualTransferInstructions({ paymentMethodKey: 'bank-transfer' }, 'GOL-1003', 'fa')?.emailSubject.includes('GOL-1003'));

const codReminder = customerOrderCodCollectionReminder({
  paymentMethodType: 'cod',
  codCollectionStatus: 'collected',
  codSettlementStatus: 'settled',
  codSettlementReference: 'COD-SETTLE-1'
}, 'GOL-4001', 'en');
assert.equal(codReminder?.collectionStatus, 'Collected at delivery');
assert.equal(codReminder?.settlementStatus, 'Settlement completed');
assert.equal(codReminder?.settlementReference, 'COD-SETTLE-1');
assert.ok(codReminder?.emailSubject.includes('GOL-4001'));
assert.ok(codReminder?.emailBody.includes('COD-SETTLE-1'));
assert.ok(customerOrderCodCollectionReminder({ paymentMethodType: 'wallet' }, 'GOL-4002', 'en') === null);
assert.ok(customerOrderCodCollectionReminder({ paymentMethodKey: 'cash-on-delivery', codCollectionStatus: 'failed' }, 'GOL-4003', 'fa')?.emailBody.includes('پیگیری'));

const approvedInstallmentMessage = customerInstallmentApprovalMessage({
  paymentMethodType: 'installment',
  installmentApprovalStatus: 'approved'
}, 'GOL-3001', 'en');
assert.equal(approvedInstallmentMessage?.status, 'approved');
assert.ok(approvedInstallmentMessage?.title.includes('approved'));
assert.ok(approvedInstallmentMessage?.emailSubject.includes('GOL-3001'));

const rejectedInstallmentMessage = customerInstallmentApprovalMessage({
  paymentMethodKey: 'installment-credit',
  installmentApprovalStatus: 'rejected'
}, 'GOL-3002', 'fa');
assert.equal(rejectedInstallmentMessage?.status, 'rejected');
assert.ok(rejectedInstallmentMessage?.title.includes('اقساط'));
assert.ok(customerInstallmentApprovalMessage({ paymentMethodType: 'wallet' }, 'GOL-3003', 'en') === null);
assert.equal(customerInstallmentApprovalMessage({ paymentMethodType: 'installment' }, 'GOL-3004', 'en')?.status, 'pending_review');
assert.equal(customerInstallmentApprovalMessage({ paymentMethodType: 'installment', installmentApprovalStatus: 'needs_follow_up' }, 'GOL-3005', 'en')?.status, 'needs_follow_up');

const walletDebitReceipt = customerWalletReceiptDetails({
  entryType: 'checkout_capture',
  direction: 'capture',
  status: 'captured',
  orderId: 'order-1',
  paymentAttemptId: 'pay-1',
  idempotencyKey: 'wallet:checkout_capture:pay-1',
  metadata: {
    orderNumber: 'GOL-2001',
    paymentAttemptId: 'pay-1',
    walletCapturedAt: '2026-06-01T10:00:00.000Z'
  }
}, 'en');
assert.equal(walletDebitReceipt?.kind, 'walletDebit');
assert.equal(walletDebitReceipt?.orderNumber, 'GOL-2001');
assert.ok(walletDebitReceipt?.title.includes('Debit') || walletDebitReceipt?.title.includes('debit'));
assert.ok(walletDebitReceipt?.eventAt);

const walletRefundReceipt = customerWalletReceiptDetails({
  entryType: 'refund_credit',
  direction: 'credit',
  status: 'posted',
  orderId: 'order-2',
  paymentAttemptId: 'pay-2',
  idempotencyKey: 'wallet:refund:pay-2',
  metadata: {
    orderNumber: 'GOL-2002',
    paymentAttemptId: 'pay-2',
    refundedAt: '2026-06-02T10:00:00.000Z'
  }
}, 'fa');
assert.equal(walletRefundReceipt?.kind, 'walletRefund');
assert.equal(walletRefundReceipt?.orderNumber, 'GOL-2002');
assert.ok(walletRefundReceipt?.title.includes('کیف پول'));
assert.ok(customerWalletReceiptDetails({ entryType: 'admin_credit', direction: 'credit', status: 'posted' }, 'en') === null);

console.log('storefront order history route copy guard passed');
