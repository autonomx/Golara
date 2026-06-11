import assert from 'node:assert/strict';
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
  () => normalizeImageUrl('http://res.cloudinary.com/demo/image/upload/sample.jpg'),
  /HTTPS/,
  'manual media URLs should reject insecure HTTP'
);

assert.throws(
  () => normalizeImageUrl('https://example.com/image.jpg'),
  /not allowed/,
  'manual media URLs should reject arbitrary external hosts'
);

console.log('media-url-allowlist: ok');
