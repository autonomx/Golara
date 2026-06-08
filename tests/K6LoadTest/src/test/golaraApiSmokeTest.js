import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.K6_VUS || 3),
  duration: __ENV.K6_DURATION || '20s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200']
  }
};

const baseUrl = __ENV.K6_BASE_URL || 'http://127.0.0.1:3100';

export default function () {
  group('public and API-backed pages', () => {
    for (const path of ['/', '/products', '/cart', '/account/login']) {
      const response = http.get(`${baseUrl}${path}`);
      check(response, {
        [`${path} returns non-error status`]: (res) => res.status >= 200 && res.status < 500
      });
    }
  });

  group('webhook rejects unsigned payloads quickly', () => {
    const response = http.post(`${baseUrl}/api/webhooks/payments/stripe`, JSON.stringify({ id: 'evt_k6_unsigned', type: 'checkout.session.completed' }), {
      headers: { 'Content-Type': 'application/json' }
    });
    check(response, {
      'unsigned Stripe webhook rejected': (res) => res.status === 401
    });
  });

  sleep(1);
}
