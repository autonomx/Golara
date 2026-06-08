import http from 'k6/http';
import { check, group, sleep } from 'k6';

const baseUrl = (__ENV.K6_BASE_URL || 'http://127.0.0.1:3100').replace(/\/$/, '');
const profile = __ENV.K6_PROFILE || 'all';
const publicPaths = (__ENV.K6_PUBLIC_PATHS || '/,/products,/cart,/account/login')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);
const catalogSearches = (__ENV.K6_CATALOG_SEARCHES || 'rose,pink,bouquet,box,gift')
  .split(',')
  .map((query) => query.trim())
  .filter(Boolean);
const categoryPaths = (__ENV.K6_CATEGORY_PATHS || '/categories,/categories/available-today,/categories/daily')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);
const staticPaths = (__ENV.K6_STATIC_PATHS || '/robots.txt,/sitemap.xml')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);

function profileIncludes(name) {
  return profile === 'all' || profile.split(',').map((item) => item.trim()).includes(name);
}

function loadStages() {
  const targets = (__ENV.K6_STAGE_TARGETS || '')
    .split(',')
    .map((target) => Number(target.trim()))
    .filter((target) => Number.isFinite(target) && target >= 0);

  if (targets.length > 0) {
    const duration = __ENV.K6_STAGE_DURATION || '5s';
    const stages = targets.map((target) => ({ duration, target }));
    if (targets[targets.length - 1] !== 0) stages.push({ duration: __ENV.K6_RAMP_DOWN || duration, target: 0 });
    return stages;
  }

  return [
    { duration: __ENV.K6_STAGE_DURATION || '5s', target: 10 },
    { duration: __ENV.K6_STAGE_DURATION || '5s', target: 20 },
    { duration: __ENV.K6_STAGE_DURATION || '5s', target: 40 },
    { duration: __ENV.K6_STAGE_DURATION || '5s', target: 80 },
    { duration: __ENV.K6_STAGE_DURATION || '5s', target: Number(__ENV.K6_TARGET_VUS || 100) },
    { duration: __ENV.K6_RAMP_DOWN || '5s', target: 0 }
  ];
}

export const options = {
  scenarios: {
    public_read_load: {
      executor: 'ramping-vus',
      stages: loadStages(),
      gracefulRampDown: '10s'
    }
  },
  thresholds: {
    http_req_failed: [`rate<${__ENV.K6_MAX_ERROR_RATE || '0.05'}`],
    http_req_duration: [`p(95)<${__ENV.K6_P95_MS || '1200'}`],
    'http_req_duration{surface:public_page}': [`p(95)<${__ENV.K6_PUBLIC_P95_MS || '1200'}`],
    'http_req_duration{surface:catalog_search}': [`p(95)<${__ENV.K6_CATALOG_P95_MS || '1200'}`],
    'http_req_duration{surface:cart_account}': [`p(95)<${__ENV.K6_CART_ACCOUNT_P95_MS || '1200'}`],
    'http_req_duration{surface:static_route}': [`p(95)<${__ENV.K6_STATIC_P95_MS || '800'}`],
    'http_req_duration{surface:webhook_route}': [`p(95)<${__ENV.K6_WEBHOOK_P95_MS || '800'}`],
    checks: [`rate>${__ENV.K6_CHECK_RATE || '0.95'}`]
  }
};

function assertNonErrorPage(path, response) {
  check(response, {
    [`${path} returns a non-error status`]: (res) => res.status >= 200 && res.status < 500,
    [`${path} has a response body`]: (res) => typeof res.body === 'string' && res.body.length > 0
  });
}

export default function () {
  if (profileIncludes('public')) group('public storefront reads', () => {
    for (const path of publicPaths) {
      const response = http.get(`${baseUrl}${path}`, {
        tags: { surface: 'public_page', path }
      });
      assertNonErrorPage(path, response);
    }
  });

  if (profileIncludes('catalog')) group('catalog browsing and search reads', () => {
    for (const query of catalogSearches) {
      const path = `/products?q=${encodeURIComponent(query)}`;
      const response = http.get(`${baseUrl}${path}`, {
        tags: { surface: 'catalog_search', path: '/products?q=' }
      });
      assertNonErrorPage(path, response);
    }

    for (const path of categoryPaths) {
      const response = http.get(`${baseUrl}${path}`, {
        tags: { surface: 'catalog_search', path }
      });
      assertNonErrorPage(path, response);
    }
  });

  if (profileIncludes('cart_account')) group('anonymous cart and account reads', () => {
    for (const path of ['/cart', '/cart/checkout', '/account/login', '/account', '/account/orders']) {
      const response = http.get(`${baseUrl}${path}`, {
        tags: { surface: 'cart_account', path }
      });
      assertNonErrorPage(path, response);
    }
  });

  if (profileIncludes('static')) group('metadata and static route reads', () => {
    for (const path of staticPaths) {
      const response = http.get(`${baseUrl}${path}`, {
        tags: { surface: 'static_route', path }
      });
      check(response, {
        [`${path} returns success`]: (res) => res.status >= 200 && res.status < 300,
        [`${path} has a response body`]: (res) => typeof res.body === 'string' && res.body.length > 0
      });
    }
  });

  if (profileIncludes('webhook')) group('payment webhook route health', () => {
    const response = http.post(
      `${baseUrl}/api/webhooks/payments/stripe`,
      JSON.stringify({ id: 'evt_k6_unsigned', type: 'checkout.session.completed' }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { surface: 'webhook_route', path: '/api/webhooks/payments/stripe' }
      }
    );

    check(response, {
      'Stripe webhook route does not server-error': (res) => res.status >= 200 && res.status < 500
    });
  });

  sleep(Number(__ENV.K6_SLEEP_SECONDS || 1));
}
