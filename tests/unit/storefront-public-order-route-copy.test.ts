import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  fulfillmentStatusLabel,
  normalizeLabelLocale,
  orderStatusLabel,
  paymentGuidanceFor,
  paymentStatusLabel,
  publicOrderCopyFor,
  resultMessageFor
} from '@/lib/checkout/public-order-labels';

const source = readFileSync('app/orders/[token]/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected public order route source to include: ${fragment}`);
}

for (const locale of ['en', 'fa'] as const) {
  const copy = publicOrderCopyFor(locale);
  for (const key of [
    'eyebrow',
    'introPrefix',
    'introSuffix',
    'total',
    'orderMode',
    'fulfillment',
    'created',
    'deliveryTiming',
    'date',
    'window',
    'notSetYet',
    'items',
    'progress',
    'noProgress',
    'privacy',
    'latestPaymentStatus',
    'paymentGuidance',
    'languageNavLabel',
    'languageCurrentPrefix',
    'languageEnglish',
    'languagePersian',
    'viewInEnglish',
    'viewInPersian'
  ] as const) {
    assert.ok(copy[key], `Expected public order copy ${key} for ${locale}`);
  }
}

for (const fragment of [
  'normalizeLabelLocale',
  'const normalizedLocale = normalizeLabelLocale(locale);',
  'publicOrderCopyFor(normalizedLocale)',
  "const isFa = normalizedLocale === 'fa';",
  '<SiteHeader locale={normalizedLocale} />',
  "dir={isFa ? 'rtl' : 'ltr'}",
  'orderStatusLabel(order.status, normalizedLocale)',
  'fulfillmentStatusLabel(order.fulfillmentStatus, normalizedLocale)',
  'paymentStatusLabel(latestAttempt.status, normalizedLocale)',
  'resultMessageFor(result, locale)',
  'paymentGuidanceFor(status, locale)',
  'formatDate(order.createdAt, normalizedLocale)',
  'formatDateOnly(order.deliveryDate, normalizedLocale)',
  'formatDate(event.createdAt, normalizedLocale)',
  'localeHref(token, \'en\', result)',
  'localeHref(token, \'fa\', result)',
  'aria-current={!isFa ? \'page\' : undefined}',
  'aria-current={isFa ? \'page\' : undefined}',
  "const metricCardClass = 'min-w-0 rounded-3xl border border-rosewood/10 bg-cream p-5';",
  "const totalValueClass = 'mt-2 max-w-full break-words font-display text-2xl leading-tight text-rosewood sm:text-3xl [overflow-wrap:anywhere]';",
  '<div className="mt-8 grid gap-4 md:grid-cols-2">',
  '<p className={totalValueClass} dir="ltr">{formatMinorUnitAmount(order.totalCents, order.currency)}</p>'
]) {
  has(fragment);
}

assert.equal(normalizeLabelLocale('fa-IR'), 'fa');
assert.equal(normalizeLabelLocale('en-CA'), 'en');
assert.equal(orderStatusLabel('paid', 'fa'), 'پرداخت دریافت شد');
assert.equal(fulfillmentStatusLabel('delivered', 'fa'), 'تحویل داده شده');
assert.equal(paymentStatusLabel('verified_paid', 'en'), 'Payment verified');
assert.ok(resultMessageFor('paid', 'fa'));
assert.ok(paymentGuidanceFor('redirect_required', 'fa'));

console.log('storefront public order route copy guard passed');
