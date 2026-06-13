import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runPaymentWebhookSecurityEventTests() {
  const serviceSource = readFileSync('lib/checkout/payment-webhook-service.ts', 'utf8');
  const loggerSource = readFileSync('lib/security/payment-webhook-events.ts', 'utf8');

  assert.match(
    serviceSource,
    /import \{ logPaymentWebhookEvent \} from ['"]@\/lib\/security\/payment-webhook-events['"]/,
    'payment webhook service should use the bounded webhook event logger'
  );

  for (const outcome of ['duplicate', 'missing_attempt']) {
    assert.match(
      serviceSource,
      new RegExp(`outcome:\\s*['"]${outcome}['"]`, 's'),
      `payment webhook ${outcome} outcome should emit a safe event`
    );
  }

  const duplicateIndex = serviceSource.indexOf("outcome: 'duplicate'");
  const duplicateReturnIndex = serviceSource.indexOf("status: 'duplicate'");
  assert.ok(duplicateIndex > -1 && duplicateReturnIndex > duplicateIndex, 'duplicate replay should log before the pure early return');

  const missingIndex = serviceSource.indexOf("outcome: 'missing_attempt'");
  const missingReturnIndex = serviceSource.indexOf("status: 'needs_attention'", missingIndex);
  assert.ok(missingIndex > -1 && missingReturnIndex > missingIndex, 'missing payment attempt should log before returning needs_attention');

  const reconcileIndex = serviceSource.indexOf('paymentSettlementRepository.upsertForPaymentEvent(created.id)');
  const finalLogIndex = serviceSource.lastIndexOf('logPaymentWebhookEvent({');
  const finalLogBlock = serviceSource.slice(finalLogIndex);
  assert.ok(finalLogIndex > reconcileIndex, 'recorded webhook outcomes should log after settlement reconciliation');
  assert.match(finalLogBlock, /needs_attention['"]\s*:\s*['"]recorded/, 'settled webhook outcomes should log recorded while mismatches log needs_attention');
  assert.match(
    finalLogBlock,
    /settlementStatus: settlementReconciliation\?\.status \|\| ['"]missing['"]/,
    'webhook event log should include bounded settlement status for incident review'
  );
  assert.match(
    finalLogBlock,
    /stateTrusted: shouldApplyState/,
    'webhook event log should include whether state transition was trusted'
  );

  assert.match(loggerSource, /redactLogValue\(/, 'payment webhook event logger should redact text values before logging');
  assert.match(loggerSource, /slice\(0,\s*maxLength\)/, 'payment webhook event text values should be bounded before logging');
  assert.match(loggerSource, /reason: safeText\(input\.reason,\s*160\)/, 'payment webhook event reasons should be bounded to 160 characters');
  assert.match(loggerSource, /console\.info\(message,\s*payload\)/, 'recorded webhook events should use structured info logging');
  assert.match(loggerSource, /console\.warn\(message,\s*payload\)/, 'attention webhook events should use structured warning logging');

  console.log('payment-webhook-security-events.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPaymentWebhookSecurityEventTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
