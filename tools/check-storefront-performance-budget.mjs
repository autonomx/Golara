import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const nextDir = '.next';
const staticDir = join(nextDir, 'static');
const buildManifestPath = join(nextDir, 'build-manifest.json');
const appBuildManifestPath = join(nextDir, 'app-build-manifest.json');

const DEFAULT_ROUTE_JS_LIMIT_BYTES = 900 * 1024;
const DEFAULT_CHUNK_LIMIT_BYTES = 450 * 1024;
const DEFAULT_TOTAL_JS_LIMIT_BYTES = 8 * 1024 * 1024;

const routeJsLimitBytes = readBudget('STOREFRONT_ROUTE_JS_BUDGET_BYTES', DEFAULT_ROUTE_JS_LIMIT_BYTES);
const chunkLimitBytes = readBudget('STOREFRONT_CHUNK_BUDGET_BYTES', DEFAULT_CHUNK_LIMIT_BYTES);
const totalJsLimitBytes = readBudget('STOREFRONT_TOTAL_JS_BUDGET_BYTES', DEFAULT_TOTAL_JS_LIMIT_BYTES);

const publicRouteCandidates = [
  { label: 'homepage', keys: ['/', '/page', 'app/page'] },
  { label: 'products', keys: ['/products', '/products/page', 'app/products/page'] },
  { label: 'categories', keys: ['/categories', '/categories/page', 'app/categories/page'] },
  {
    label: 'product detail',
    keys: ['/products/[slug]', '/products/[slug]/page', 'app/products/[slug]/page']
  },
  {
    label: 'category detail',
    keys: ['/categories/[slug]', '/categories/[slug]/page', 'app/categories/[slug]/page']
  }
];

function readBudget(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer byte value.`);
  }
  return value;
}

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function toBytesLabel(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function staticAssetSize(assetPath) {
  const normalized = assetPath.replace(/^\//, '');
  const path = normalized.startsWith('_next/')
    ? join('.next', normalized.replace(/^_next\//, ''))
    : join(nextDir, normalized);

  if (!existsSync(path)) return 0;
  return statSync(path).size;
}

function isStaticJs(assetPath) {
  return assetPath.startsWith('static/') && assetPath.endsWith('.js');
}

function routeFilesFor(manifest, routeCandidate) {
  if (!manifest) return [];

  const pages = manifest.pages || {};
  const appPages = manifest.pages || manifest.app || {};

  for (const key of routeCandidate.keys) {
    const pageFiles = pages[key] || appPages[key];
    if (Array.isArray(pageFiles)) return pageFiles;
  }

  return [];
}

function collectAllManifestFiles(...manifests) {
  const files = new Set();
  for (const manifest of manifests) {
    if (!manifest) continue;
    const sections = [manifest.pages, manifest.app, manifest.rootMainFiles, manifest.polyfillFiles, manifest.devFiles];
    for (const section of sections) {
      if (Array.isArray(section)) {
        section.forEach((file) => files.add(file));
      } else if (section && typeof section === 'object') {
        Object.values(section).flat().forEach((file) => files.add(file));
      }
    }
  }
  return [...files].filter((file) => typeof file === 'string' && isStaticJs(file));
}

function assertBuildExists() {
  if (!existsSync(nextDir)) {
    throw new Error('Missing .next build output. Run `npm run build` before the storefront performance budget check.');
  }
  if (!existsSync(staticDir)) {
    throw new Error('Missing .next/static build output. Run `npm run build` before the storefront performance budget check.');
  }
}

assertBuildExists();

const buildManifest = readJson(buildManifestPath);
const appBuildManifest = readJson(appBuildManifestPath);
const failures = [];
const routeSummaries = [];

for (const routeCandidate of publicRouteCandidates) {
  const files = new Set([
    ...routeFilesFor(buildManifest, routeCandidate),
    ...routeFilesFor(appBuildManifest, routeCandidate)
  ]);
  const jsFiles = [...files].filter(isStaticJs);
  const totalBytes = jsFiles.reduce((sum, file) => sum + staticAssetSize(file), 0);

  routeSummaries.push({ label: routeCandidate.label, jsFiles: jsFiles.length, totalBytes });
  if (totalBytes > routeJsLimitBytes) {
    failures.push(
      `${routeCandidate.label} route JS is ${toBytesLabel(totalBytes)}; budget is ${toBytesLabel(routeJsLimitBytes)}.`
    );
  }
}

const allJsFiles = collectAllManifestFiles(buildManifest, appBuildManifest);
const totalJsBytes = allJsFiles.reduce((sum, file) => sum + staticAssetSize(file), 0);
const largestChunk = allJsFiles
  .map((file) => ({ file, bytes: staticAssetSize(file) }))
  .sort((a, b) => b.bytes - a.bytes)[0];

if (totalJsBytes > totalJsLimitBytes) {
  failures.push(`Total manifest JS is ${toBytesLabel(totalJsBytes)}; budget is ${toBytesLabel(totalJsLimitBytes)}.`);
}

if (largestChunk && largestChunk.bytes > chunkLimitBytes) {
  failures.push(
    `Largest JS chunk ${largestChunk.file} is ${toBytesLabel(largestChunk.bytes)}; budget is ${toBytesLabel(chunkLimitBytes)}.`
  );
}

console.log('Storefront performance budget summary:');
for (const summary of routeSummaries) {
  console.log(`- ${summary.label}: ${summary.jsFiles} JS file(s), ${toBytesLabel(summary.totalBytes)}`);
}
console.log(`- total manifest JS: ${toBytesLabel(totalJsBytes)} across ${allJsFiles.length} file(s)`);
if (largestChunk) console.log(`- largest JS chunk: ${largestChunk.file} (${toBytesLabel(largestChunk.bytes)})`);
console.log(
  `Budgets: route ${toBytesLabel(routeJsLimitBytes)}, chunk ${toBytesLabel(chunkLimitBytes)}, total ${toBytesLabel(totalJsLimitBytes)}`
);

if (failures.length > 0) {
  console.error('\nStorefront performance budget failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nStorefront performance budgets passed.');
