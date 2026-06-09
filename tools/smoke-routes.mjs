const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const baseUrl = (process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS || '10000', 10);

const routes = [
  { path: '/', expectedStatuses: [200], label: 'homepage', expectedContent: ['Golara'] },
  { path: '/products', expectedStatuses: [200], label: 'product listing', expectedAnyContent: ['All products', 'همه محصولات'] },
  { path: '/products?q=nomatchflower', expectedStatuses: [200], label: 'product search empty state', expectedAnyContent: ['No products found', 'محصولی پیدا نشد'] },
  { path: '/cart', expectedStatuses: [200], label: 'cart', expectedAnyContent: ['cart', 'سبد خرید'] },
  { path: '/account', expectedStatuses: [200], label: 'account overview', expectedAnyContent: ['Customer account', 'حساب مشتری'] },
  { path: '/account/profile', expectedStatuses: [200, 302, 303, 307, 308], label: 'account profile' },
  { path: '/account/login', expectedStatuses: [200], label: 'account login', expectedAnyContent: ['phone', 'شماره تلفن'] },
  { path: '/sitemap.xml', expectedStatuses: [200], label: 'sitemap', expectedContent: ['<urlset'] },
  { path: '/robots.txt', expectedStatuses: [200], label: 'robots', expectedContent: ['User-agent'] },
  { path: '/account/orders', expectedStatuses: [200, 302, 303, 307, 308], label: 'unauthenticated account orders' }
];

function includesExpectedContent(body, expectedContent = []) {
  const normalizedBody = body.toLowerCase();
  return expectedContent.every((value) => normalizedBody.includes(value.toLowerCase()));
}

function includesAnyExpectedContent(body, expectedAnyContent = []) {
  if (!expectedAnyContent.length) return true;
  const normalizedBody = body.toLowerCase();
  return expectedAnyContent.some((value) => normalizedBody.includes(value.toLowerCase()));
}

async function checkRoute(route) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${baseUrl}${route.path}`;

  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: controller.signal
    });
    const statusOk = route.expectedStatuses.includes(response.status);
    let contentOk = true;
    let missingContent = [];

    if (statusOk && route.expectedContent?.length) {
      const body = await response.text();
      contentOk = includesExpectedContent(body, route.expectedContent);
      if (!contentOk) {
        const normalizedBody = body.toLowerCase();
        missingContent = route.expectedContent.filter((value) => !normalizedBody.includes(value.toLowerCase()));
      }
    }

    if (statusOk && route.expectedAnyContent?.length) {
      const body = await response.text();
      contentOk = includesAnyExpectedContent(body, route.expectedAnyContent);
      if (!contentOk) missingContent = route.expectedAnyContent;
    }

    return {
      ...route,
      ok: statusOk && contentOk,
      status: response.status,
      statusOk,
      contentOk,
      missingContent,
      url
    };
  } catch (error) {
    return {
      ...route,
      ok: false,
      status: 'error',
      statusOk: false,
      contentOk: false,
      missingContent: route.expectedContent || route.expectedAnyContent || [],
      url,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

const results = [];
for (const route of routes) {
  // Keep these sequential so local logs are stable and easy to read.
  results.push(await checkRoute(route));
}

for (const result of results) {
  const marker = result.ok ? 'PASS' : 'FAIL';
  const details = [`status ${result.status}`];
  if (result.expectedContent?.length || result.expectedAnyContent?.length) {
    details.push(result.contentOk ? 'content ok' : `missing content: ${result.missingContent.join(', ')}`);
  }
  if (result.error) details.push(result.error);
  console.log(`${marker} ${result.label}: ${result.url} -> ${details.join('; ')}`);
}

const failures = results.filter((result) => !result.ok);
if (failures.length > 0) {
  console.error(`\n${failures.length} smoke route check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} smoke route checks passed.`);
