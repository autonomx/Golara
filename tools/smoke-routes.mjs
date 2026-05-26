const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const baseUrl = (process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS || '10000', 10);

const routes = [
  { path: '/', expectedStatuses: [200], label: 'homepage' },
  { path: '/products', expectedStatuses: [200], label: 'product listing' },
  { path: '/cart', expectedStatuses: [200], label: 'cart' },
  { path: '/account/login', expectedStatuses: [200], label: 'account login' },
  { path: '/sitemap.xml', expectedStatuses: [200], label: 'sitemap' },
  { path: '/robots.txt', expectedStatuses: [200], label: 'robots' },
  { path: '/account/orders', expectedStatuses: [200, 302, 303, 307, 308], label: 'unauthenticated account orders' }
];

async function checkRoute(route) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${baseUrl}${route.path}`;

  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: controller.signal
    });
    const ok = route.expectedStatuses.includes(response.status);
    return {
      ...route,
      ok,
      status: response.status,
      url
    };
  } catch (error) {
    return {
      ...route,
      ok: false,
      status: 'error',
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
  const detail = result.error ? `${result.status} (${result.error})` : result.status;
  console.log(`${marker} ${result.label}: ${result.url} -> ${detail}`);
}

const failures = results.filter((result) => !result.ok);
if (failures.length > 0) {
  console.error(`\n${failures.length} smoke route check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} smoke route checks passed.`);
