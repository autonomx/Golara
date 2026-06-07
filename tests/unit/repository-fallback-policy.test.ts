import assert from 'node:assert/strict';
import { readWithSeedFallback } from '../../lib/cms/repository-fallback-policy';

function restoreEnv(snapshot: NodeJS.ProcessEnv) {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, snapshot);
}

async function withEnv<T>(env: Record<string, string | undefined>, run: () => Promise<T> | T) {
  const originalEnv = { ...process.env };
  restoreEnv(originalEnv);
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await run();
  } finally {
    restoreEnv(originalEnv);
  }
}

export async function runRepositoryFallbackPolicyTests() {
  await withEnv({ APP_MODE: 'preview', DATABASE_URL: undefined, VERCEL_ENV: undefined, NODE_ENV: 'production' }, async () => {
    const result = await readWithSeedFallback(
      async () => 'db-result',
      () => 'seed-result',
      'preview-missing-db'
    );
    assert.equal(result, 'seed-result');
  });

  await withEnv({ APP_MODE: 'production', DATABASE_URL: undefined, VERCEL_ENV: undefined, NODE_ENV: 'production' }, async () => {
    await assert.rejects(
      () => readWithSeedFallback(async () => 'db-result', () => 'seed-result', 'production-missing-db'),
      /DATABASE_URL is required/
    );
  });

  await withEnv({ APP_MODE: 'preview', DATABASE_URL: 'postgresql://example.invalid/db', VERCEL_ENV: undefined, NODE_ENV: 'production' }, async () => {
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
}
