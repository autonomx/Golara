import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertImageSignatureMatchesType, sniffImageMimeType } from '@/lib/media/image-signature';

function assertThrowsMessage(fn: () => void, message: RegExp) {
  assert.throws(fn, (error) => error instanceof Error && message.test(error.message));
}

export async function runMediaUploadAllowlistGateTests() {
  const mediaStorageSource = readFileSync('lib/media/media-storage.ts', 'utf8');
  const imageSignatureSource = readFileSync('lib/media/image-signature.ts', 'utf8');

  assert.match(mediaStorageSource, /const MAX_UPLOAD_BYTES = 4 \* 1024 \* 1024/);
  assert.match(mediaStorageSource, /const ALLOWED_IMAGE_TYPES = new Set\(\['image\/jpeg', 'image\/png', 'image\/webp', 'image\/gif'\]\)/);
  assert.match(mediaStorageSource, /const ALLOWED_EXTERNAL_IMAGE_HOSTS = new Set\(\['res\.cloudinary\.com'\]\)/);
  assert.match(mediaStorageSource, /assertValidImageUpload\(file\)/);
  assert.match(mediaStorageSource, /assertImageSignatureMatchesType\(file\.type, bytes\)/);
  assert.match(mediaStorageSource, /writeFile\(diskPath, bytes\)/);
  assert.match(mediaStorageSource, /new File\(\[bytes\], file\.name/);
  assert.doesNotMatch(mediaStorageSource, /formData\.set\('file', file\)/);

  assert.match(imageSignatureSource, /const MIN_SIGNATURE_BYTES = 12/);
  assert.match(imageSignatureSource, /sniffImageMimeType/);
  assert.match(imageSignatureSource, /image\/jpeg/);
  assert.match(imageSignatureSource, /image\/png/);
  assert.match(imageSignatureSource, /image\/gif/);
  assert.match(imageSignatureSource, /image\/webp/);
  assert.match(imageSignatureSource, /Image upload signature is not a supported image format/);
  assert.match(imageSignatureSource, /Image upload content does not match the declared MIME type/);

  assert.equal(sniffImageMimeType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 'image/jpeg');
  assert.equal(sniffImageMimeType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00])), 'image/png');
  assert.equal(sniffImageMimeType(new TextEncoder().encode('GIF89a000000')), 'image/gif');
  assert.equal(sniffImageMimeType(new TextEncoder().encode('RIFF0000WEBP')), 'image/webp');
  assert.equal(sniffImageMimeType(new TextEncoder().encode('<svg><script>')), null);

  assert.doesNotThrow(() => assertImageSignatureMatchesType('image/png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00])));
  assertThrowsMessage(() => assertImageSignatureMatchesType('image/jpeg', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00])), /does not match/);
  assertThrowsMessage(() => assertImageSignatureMatchesType('image/png', new TextEncoder().encode('<svg><script>')), /not a supported image/);

  console.log('media-upload-allowlist-gate.test.ts passed');
}

if (require.main === module) {
  runMediaUploadAllowlistGateTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
