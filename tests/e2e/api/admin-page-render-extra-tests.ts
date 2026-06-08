import assert from 'node:assert/strict';
import { createAdminCookieJar, request } from './shared';

export async function runExtraAdminPageRenderApiTests() {
  const adminJar = createAdminCookieJar();
  const paths = [
    '/admin/products',
    '/admin/categories',
    '/admin/orders',
    '/admin/inquiries',
    '/admin/settings',
    '/admin/homepage',
    '/admin/media',
    '/admin/translations'
  ];

  for (const path of paths) {
    const response = await request(path, { headers: { cookie: adminJar.header() } });
    assert.equal(response.status, 200, `${path} should render for admin API coverage`);
  }
}
