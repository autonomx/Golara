import assert from 'node:assert/strict';
import { source } from './api-hardening-source';
import {
  appendServerActionFields,
  createAdminCookieJar,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runMediaPayloadHardeningTests(fixture: ApiFixture) {
  const storage = source('lib/media/media-storage.ts');
  assert.match(storage, /MAX_UPLOAD_BYTES = 4 \* 1024 \* 1024/);
  assert.match(storage, /ALLOWED_IMAGE_TYPES[\s\S]*?image\/jpeg[\s\S]*?image\/png[\s\S]*?image\/webp[\s\S]*?image\/gif/);

  const adminJar = createAdminCookieJar();
  const mediaHtml = await responseText(await request('/admin/media', { headers: { cookie: adminJar.header() } }));
  const textUpload = new FormData();
  appendServerActionFields(textUpload, mediaHtml, 'name="file"');
  textUpload.set('mediaCategory', 'product');
  textUpload.set('alt', 'API E2E text upload rejection');
  textUpload.set('file', new File(['not actually an image'], 'not-image.txt', { type: 'text/plain' }));
  const textResponse = await submitServerAction('/admin/media', textUpload, adminJar);
  assert.equal(textResponse.status === 500 || [302, 303, 307, 308].includes(textResponse.status), true);
  assert.equal(await fixture.prisma.media.count({ where: { alt: 'API E2E text upload rejection' } }), 0);

  const largeUpload = new FormData();
  appendServerActionFields(largeUpload, mediaHtml, 'name="file"');
  largeUpload.set('mediaCategory', 'product');
  largeUpload.set('alt', 'API E2E large upload rejection');
  largeUpload.set('file', new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'too-large.png', { type: 'image/png' }));
  const largeResponse = await submitServerAction('/admin/media', largeUpload, adminJar);
  assert.equal(largeResponse.status === 500 || [302, 303, 307, 308].includes(largeResponse.status), true);
  assert.equal(await fixture.prisma.media.count({ where: { alt: 'API E2E large upload rejection' } }), 0);
}
