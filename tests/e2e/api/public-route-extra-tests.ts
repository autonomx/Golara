import assert from 'node:assert/strict';
import { request } from './shared';

export async function runExtraPublicRouteApiTests() {
  const routes = [
    '/',
    '/products',
    '/categories',
    '/cart',
    '/cart/checkout',
    '/account/login',
    '/sitemap.xml',
    '/robots.txt'
  ];

  for (const route of routes) {
    const response = await request(route, { redirect: 'manual' });
    assert.equal([200, 302, 303, 307, 308].includes(response.status), true, `${route} should return a handled response`);
  }
}
