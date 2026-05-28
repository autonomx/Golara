import assert from 'node:assert/strict';
import { getRuntimeReadiness } from '../../lib/runtime-readiness';

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

export async function runRuntimeReadinessTests() {
  await withEnv({ APP_MODE: 'production', DATABASE_URL: undefined, VERCEL_ENV: undefined, NODE_ENV: 'production' }, () => {
    assert.deepEqual(getRuntimeReadiness(), {
      appMode: 'production',
      nodeEnv: 'production',
      vercelEnv: 'not set',
      databaseUrlPresent: false,
      seedFallbackAllowed: false,
      productionSafe: false
    });
  });

  await withEnv({ APP_MODE: 'production', DATABASE_URL: 'postgresql://example.invalid/db', VERCEL_ENV: 'production', NODE_ENV: 'production' }, () => {
    assert.deepEqual(getRuntimeReadiness(), {
      appMode: 'production',
      nodeEnv: 'production',
      vercelEnv: 'production',
      databaseUrlPresent: true,
      seedFallbackAllowed: false,
      productionSafe: true
    });
  });

  await withEnv({ APP_MODE: 'preview', DATABASE_URL: undefined, VERCEL_ENV: 'preview', NODE_ENV: 'production' }, () => {
    assert.deepEqual(getRuntimeReadiness(), {
      appMode: 'preview',
      nodeEnv: 'production',
      vercelEnv: 'preview',
      databaseUrlPresent: false,
      seedFallbackAllowed: true,
      productionSafe: true
    });
  });

  await withEnv({ APP_MODE: undefined, DATABASE_URL: undefined, VERCEL_ENV: 'production', NODE_ENV: 'production' }, () => {
    const readiness = getRuntimeReadiness();
    assert.equal(readiness.appMode, 'production');
    assert.equal(readiness.databaseUrlPresent, false);
    assert.equal(readiness.seedFallbackAllowed, false);
    assert.equal(readiness.productionSafe, false);
  });

  console.log('runtime-readiness.test.ts passed');
}
