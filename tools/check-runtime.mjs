#!/usr/bin/env node

const ORIGINAL_ENV = { ...process.env };

function setEnv(env) {
  process.env = { ...ORIGINAL_ENV, ...env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
  }
}

function getAppRuntimeMode() {
  const configuredMode = process.env.APP_MODE?.trim().toLowerCase();
  if (configuredMode === 'production') return 'production';
  if (configuredMode === 'test') return 'test';
  if (configuredMode === 'development') return 'development';
  if (configuredMode === 'preview') return 'preview';

  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'development') return 'development';

  return 'preview';
}

function canUseSeedFallback() {
  return getAppRuntimeMode() !== 'production';
}

function assertDatabaseOrPreviewFallback(context) {
  if (process.env.DATABASE_URL?.trim() || canUseSeedFallback()) return;

  throw new Error(
    `${context}: DATABASE_URL is required when APP_MODE=production or VERCEL_ENV=production. ` +
      'Set APP_MODE=preview for seeded preview builds, or configure DATABASE_URL for production.'
  );
}

function hasDatabase() {
  assertDatabaseOrPreviewFallback('database availability check');
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function readWithSeedFallback(readFromDb, fallback, context) {
  assertDatabaseOrPreviewFallback(context);

  if (!hasDatabase()) return fallback();

  try {
    return await readFromDb();
  } catch (error) {
    if (!canUseSeedFallback()) throw error;
    return fallback();
  }
}

async function assertRejects(label, run, pattern) {
  try {
    await run();
  } catch (error) {
    if (pattern.test(String(error?.message ?? error))) {
      console.log(`✓ ${label}`);
      return;
    }
    throw new Error(`${label}: rejected with unexpected error: ${String(error?.message ?? error)}`);
  }
  throw new Error(`${label}: expected rejection`);
}

async function assertEquals(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`✓ ${label}`);
}

async function main() {
  setEnv({ APP_MODE: 'production', DATABASE_URL: undefined, VERCEL_ENV: undefined, NODE_ENV: 'production' });
  await assertRejects('production without DATABASE_URL fails hasDatabase()', () => Promise.resolve(hasDatabase()), /DATABASE_URL is required/);

  setEnv({ APP_MODE: 'production', DATABASE_URL: 'postgresql://example.invalid/db', VERCEL_ENV: undefined, NODE_ENV: 'production' });
  await assertRejects(
    'production database read errors rethrow',
    () => readWithSeedFallback(
      async () => {
        throw new Error('db unavailable');
      },
      () => 'seed-result',
      'runtime-smoke-production-db-error'
    ),
    /db unavailable/
  );

  setEnv({ APP_MODE: 'preview', DATABASE_URL: undefined, VERCEL_ENV: undefined, NODE_ENV: 'production' });
  await assertEquals(
    'preview without DATABASE_URL can use seed fallback',
    await readWithSeedFallback(async () => 'db-result', () => 'seed-result', 'runtime-smoke-preview-missing-db'),
    'seed-result'
  );

  process.env = { ...ORIGINAL_ENV };
  console.log('runtime smoke checks passed');
}

main().catch((error) => {
  process.env = { ...ORIGINAL_ENV };
  console.error(error);
  process.exit(1);
});
