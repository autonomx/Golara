import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeImageUrl } from '@/lib/media/media-storage';

assert.equal(
  normalizeImageUrl('/uploads/demo.jpg'),
  '/uploads/demo.jpg',
  'local upload URLs should remain valid'
);

assert.equal(
  normalizeImageUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg'),
  'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  'approved HTTPS Cloudinary URLs should remain valid'
);

assert.throws(
  () => normalizeImageUrl('/uploads/../secret.jpg'),
  /safe file directly under \/uploads\//,
  'local upload URLs should reject path traversal segments'
);

assert.throws(
  () => normalizeImageUrl('/uploads/%2e%2e/secret.jpg'),
  /safe file directly under \/uploads\//,
  'local upload URLs should reject encoded traversal segments'
);

assert.throws(
  () => normalizeImageUrl('/uploads/nested/demo.jpg'),
  /safe file directly under \/uploads\//,
  'local upload URLs should reject nested paths'
);

assert.throws(
  () => normalizeImageUrl('/uploads/demo.jpg?download=1'),
  /safe file directly under \/uploads\//,
  'local upload URLs should reject query strings'
);

assert.throws(
  () => normalizeImageUrl('http://res.cloudinary.com/demo/image/upload/sample.jpg'),
  /HTTPS/,
  'manual media URLs should reject insecure HTTP'
);

assert.throws(
  () => normalizeImageUrl('https://example.com/image.jpg'),
  /not allowed/,
  'manual media URLs should reject arbitrary external hosts'
);

const mediaStorageSource = readFileSync('lib/media/media-storage.ts', 'utf8');
assert.match(
  mediaStorageSource,
  /const normalizedUrl = normalizeImageUrl\(url\);[\s\S]*url: normalizedUrl/,
  'Cloudinary upload responses should be normalized through the media URL allowlist before storage'
);

console.log('media-url-allowlist: ok');
