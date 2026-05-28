import assert from 'node:assert/strict';

const ORIGINAL_ENV = { ...process.env };

async function withEnv<T>(env: Record<string, string | undefined>, run: () => Promise<T> | T) {
  process.env = { ...ORIGINAL_ENV };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await run();
  } finally {
    process.env = { ...ORIGINAL_ENV };
  }
}

async function importPrismaHelpers() {
  const moduleId = `../../lib/prisma.ts?cache=${Date.now()}-${Math.random()}`;
  return import(moduleId);
}

await withEnv({ APP_MODE: 'production', DATABASE_URL: undefined, VERCEL_ENV: undefined, NODE_ENV: 'production' }, async () => {
  const { getAppRuntimeMode, hasDatabase, canUseSeedFallback, assertDatabaseOrPreviewFallback } = await importPrismaHelpers();
  assert.equal(getAppRuntimeMode(), 'production');
  assert.equal(canUseSeedFallback(), false);
  assert.throws(() => hasDatabase(), /DATABASE_URL is required/);
  assert.throws(() => assertDatabaseOrPreviewFallback('unit-test'), /DATABASE_URL is required/);
});

await withEnv({ APP_MODE: 'preview', DATABASE_URL: undefined, VERCEL_ENV: undefined, NODE_ENV: 'production' }, async () => {
  const { getAppRuntimeMode, hasDatabase, canUseSeedFallback, assertDatabaseOrPreviewFallback } = await importPrismaHelpers();
  assert.equal(getAppRuntimeMode(), 'preview');
  assert.equal(hasDatabase(), false);
  assert.equal(canUseSeedFallback(), true);
  assert.doesNotThrow(() => assertDatabaseOrPreviewFallback('unit-test'));
});

await withEnv({ APP_MODE: undefined, DATABASE_URL: undefined, VERCEL_ENV: 'production', NODE_ENV: 'production' }, async () => {
  const { getAppRuntimeMode, hasDatabase, canUseSeedFallback } = await importPrismaHelpers();
  assert.equal(getAppRuntimeMode(), 'production');
  assert.equal(canUseSeedFallback(), false);
  assert.throws(() => hasDatabase(), /DATABASE_URL is required/);
});

await withEnv({ APP_MODE: 'development', DATABASE_URL: 'postgresql://example.invalid/db', VERCEL_ENV: undefined, NODE_ENV: 'development' }, async () => {
  const { getAppRuntimeMode, hasDatabase, canUseSeedFallback, assertDatabaseOrPreviewFallback } = await importPrismaHelpers();
  assert.equal(getAppRuntimeMode(), 'development');
  assert.equal(hasDatabase(), true);
  assert.equal(canUseSeedFallback(), true);
  assert.doesNotThrow(() => assertDatabaseOrPreviewFallback('unit-test'));
});

console.log('runtime-mode.test.ts passed');
