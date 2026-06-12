import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertImageSignatureMatchesType, sniffImageMimeType } from '@/lib/media/image-signature';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const gif = new TextEncoder().encode('GIF89a000000');
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const svg = new TextEncoder().encode('<svg><script>alert(1)</script></svg>');

export async function runMediaUploadSignatureTests() {
  assert.equal(sniffImageMimeType(jpeg), 'image/jpeg');
  assert.equal(sniffImageMimeType(png), 'image/png');
  assert.equal(sniffImageMimeType(gif), 'image/gif');
  assert.equal(sniffImageMimeType(webp), 'image/webp');
  assert.equal(sniffImageMimeType(svg), null);

  assert.doesNotThrow(() => assertImageSignatureMatchesType('image/jpeg', jpeg));
  assert.throws(
    () => assertImageSignatureMatchesType('image/png', jpeg),
    /does not match the declared MIME type/
  );
  assert.throws(
    () => assertImageSignatureMatchesType('image/svg+xml', svg),
    /signature is not a supported image format/
  );
  assert.throws(
    () => assertImageSignatureMatchesType('image/png', new Uint8Array([0x89, 0x50])),
    /too small to validate safely/
  );

  const storageSource = readFileSync('lib/media/media-storage.ts', 'utf8');
  assert.match(storageSource, /validatedUploadBytes/);
  assert.match(storageSource, /assertImageSignatureMatchesType\(file\.type, bytes\)/);
  assert.match(storageSource, /const safeFile = new File\(\[bytes\], file\.name/);
  assert.doesNotMatch(storageSource, /formData\.set\('file', file\)/);

  console.log('media-upload-signature.test.ts passed');
}
