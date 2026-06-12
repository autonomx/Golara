import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { safeReturnPath } from '@/lib/security/safe-return-path';
import { serializeJsonLd } from '@/lib/structured-data';

export async function runInputXssSafetyTests() {
  const serialized = serializeJsonLd({
    name: '</script><img src=x onerror=alert(1)>',
    value: 'a&b',
    lineSeparators: 'before\u2028middle\u2029after'
  });

  assert.doesNotMatch(serialized, /<\/script/i);
  assert.doesNotMatch(serialized, /<img/i);
  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.match(serialized, /\\u003cimg src=x onerror=alert\(1\)\\u003e/);
  assert.match(serialized, /a\\u0026b/);
  assert.match(serialized, /\\u2028/);
  assert.match(serialized, /\\u2029/);

  const structuredDataSource = readFileSync('lib/structured-data.ts', 'utf8');
  assert.match(structuredDataSource, /function serializeJsonLd/);
  assert.match(structuredDataSource, /dangerouslySetInnerHTML: \{ __html: serializeJsonLd\(data\) \}/);
  assert.doesNotMatch(structuredDataSource, /dangerouslySetInnerHTML: \{ __html: JSON\.stringify/);

  assert.equal(safeReturnPath('/products/ruby-rose?cart=added#details', '/cart'), '/products/ruby-rose?cart=added#details');
  assert.equal(safeReturnPath('https://evil.example/path', '/cart'), '/cart');
  assert.equal(safeReturnPath('//evil.example/path', '/cart'), '/cart');
  assert.equal(safeReturnPath('/\\evil.example/path', '/cart'), '/cart');
  assert.equal(safeReturnPath('/products/ruby\r\nSet-Cookie:attack=true', '/cart'), '/cart');
  assert.equal(safeReturnPath('/account/profile', 'https://evil.example/fallback'), '/account/profile');
  assert.equal(safeReturnPath('', 'https://evil.example/fallback'), '/');

  console.log('input-xss-safety.test.ts passed');
}
