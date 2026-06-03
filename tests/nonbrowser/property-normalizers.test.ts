import assert from 'node:assert/strict';
import { normalizeStorefrontChannelCurrency } from '../../lib/channels/channel-repository';
import { normalizeImportExportJobTarget } from '../../lib/settings/import-export-job-tracking';
import { normalizeIntegrationAppKey, normalizeIntegrationPermissionList } from '../../lib/settings/integration-app-registry';
import { normalizePromotionVoucherCode } from '../../lib/promotions/promotion-voucher-repository';
import { normalizeWebhookKey, normalizeWebhookTargetUrl } from '../../lib/settings/webhook-configuration';

const oddInputs = [
  '',
  '   ',
  'Hello World',
  ' Persian Flowers ',
  'UPPER_lower-123',
  'symbols!@#$%^&*()',
  'fa_IR',
  'https://example.com/path?q=1',
  '///relative/path///'
];

const nonBlankInputs = oddInputs.filter((input) => input.trim().length > 0);

function runStableStringNormalizers() {
  for (const input of oddInputs) {
    assert.doesNotThrow(() => normalizeIntegrationAppKey(input));
    assert.doesNotThrow(() => normalizeWebhookKey(input));
    assert.doesNotThrow(() => normalizeStorefrontChannelCurrency(input));
    assert.doesNotThrow(() => normalizeImportExportJobTarget(input));
  }

  assert.throws(() => normalizePromotionVoucherCode(''), /required/);
  assert.throws(() => normalizePromotionVoucherCode('   '), /required/);
  for (const input of nonBlankInputs) {
    assert.doesNotThrow(() => normalizePromotionVoucherCode(input));
  }
}

function runDeterministicNormalizerTests() {
  for (const input of oddInputs) {
    assert.equal(normalizeIntegrationAppKey(input), normalizeIntegrationAppKey(input));
    assert.equal(normalizeWebhookKey(input), normalizeWebhookKey(input));
    assert.equal(normalizeStorefrontChannelCurrency(input), normalizeStorefrontChannelCurrency(input));
    assert.equal(normalizeImportExportJobTarget(input), normalizeImportExportJobTarget(input));
  }
  for (const input of nonBlankInputs) {
    assert.equal(normalizePromotionVoucherCode(input), normalizePromotionVoucherCode(input));
  }
}

function runUrlNormalizerTests() {
  assert.equal(normalizeWebhookTargetUrl('example.com/hook'), 'https://example.com/hook');
  assert.equal(normalizeWebhookTargetUrl('https://example.com/hook'), 'https://example.com/hook');
  assert.equal(normalizeWebhookTargetUrl('not a url'), 'https://example.com/webhooks/golara');
}

function runScopedPermissionTests() {
  assert.deepEqual(normalizeIntegrationPermissionList(['orders:read', 'orders:read', 'orders:write']), ['orders:read', 'orders:write']);
  assert.deepEqual(normalizeIntegrationPermissionList(['plain words']), ['webhooks:read', 'webhooks:write']);
}

export async function runPropertyNormalizerTests() {
  runStableStringNormalizers();
  runDeterministicNormalizerTests();
  runUrlNormalizerTests();
  runScopedPermissionTests();
  console.log('property-normalizers.test.ts passed');
}
