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

async function importFallbackPolicy() {
  const moduleId = `../../lib/cms/repository-fallback-policy.ts?cache=${Date.now()}-${Math.random()}`;
  return import(moduleId);
}

await withEnv({ APP_MODE: 'preview', DATABASE_URL: undefined, VERCEL_ENV: undefined, NODE_ENV: 'production' }, async () => {
  const { readWithSeedFallback } = await importFallbackPolicy();
  const result = await readWithSeedFallback(
    async () => 'db-result',
    () => 'seed-result',
    'preview-missing-db'
  );
  assert.equal(result, 'seed-result');
});

await withEnv({ APP_MODE: 'production', DATABASE_URL: undefined, VERCEL_ENV: undefined, NODE_ENV: 'production' }, async () => {
  const { readWithSeedFallback } = await importFallbackPolicy();
  await assert.rejects(
    () => readWithSeedFallback(async () => 'db-result', () => 'seed-result', 'production-missing-db'),
    /DATABASE_URL is required/
  );
});

await withEnv({ APP_MODE: 'preview', DATABASE_URL: 'postgresql://example.invalid/db', VERCEL_ENV: undefined, NODE_ENV: 'production' }, async () => {
  const { readWithSeedFallback } = await importFallbackPolicy();
  const result = await readWithSeedFallback(
    async () => {
      throw new Error('db unavailable');
    },
    () => 'seed-result',
    'preview-db-error'
  );
  assert.equal(result, 'seed-result');
});

await withEnv({ APP_MODE: 'production', DATABASE_URL: 'postgresql://example.invalid/db', VERCEL_ENV: undefined, NODE_ENV: 'production' }, async () => {
  const { readWithSeedFallback } = await importFallbackPolicy();
  await assert.rejects(
    () => readWithSeedFallback(
      async () => {
        throw new Error('db unavailable');
      },
      () => 'seed-result',
      'production-db-error'
    ),
    /db unavailable/
  );
});

console.log('repository-fallback-policy.test.ts passed');
