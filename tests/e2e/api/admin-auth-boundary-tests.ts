import assert from 'node:assert/strict';
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth-core';
import { CookieJar, expectHtml, request, type ApiFixture } from './shared';

export async function runAdminAuthBoundaryTests(fixture: ApiFixture) {
  await runTamperedAdminCookiePageGuards(fixture);
  await runTamperedAdminCookieExportGuards();
}

async function runTamperedAdminCookiePageGuards(fixture: ApiFixture) {
  const jar = new CookieJar();
  jar.set(ADMIN_SESSION_COOKIE_NAME, 'tampered-admin-session-cookie');
  await expectHtml('/admin', 200, ['Sign in'], jar);
  await expectHtml('/admin/orders', 200, ['Sign in'], jar);

  const order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { orderNumber: fixture.orderNumber } });
  const detailResponse = await request(`/admin/orders/${order.id}`, { headers: { cookie: jar.header() } });
  assert.equal(detailResponse.status, 200);
  const detailHtml = await detailResponse.text();
  assert.doesNotMatch(detailHtml, new RegExp(order.orderNumber));
  assert.match(detailHtml, /Loading sales|Admin authentication is required|Something went wrong/i);
}

async function runTamperedAdminCookieExportGuards() {
  const jar = new CookieJar();
  jar.set(ADMIN_SESSION_COOKIE_NAME, 'tampered-admin-session-cookie');
  const productsExport = await request('/admin/products/export', { headers: { cookie: jar.header() } });
  assert.equal(productsExport.status, 401);
  const ordersCsv = await request('/admin/orders/csv', { headers: { cookie: jar.header() } });
  assert.equal(ordersCsv.status, 401);
}
