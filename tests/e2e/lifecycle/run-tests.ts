import assert from 'node:assert/strict';

import {
  assertSafeLifecycleDatabaseUrl,
  createLifecyclePrismaClient,
  getLifecycleTestDbConfig,
  resetLifecycleDatabase
} from './test-db';

async function runLifecycleDatabaseHarnessSmoke(databaseUrl: string) {
  const prisma = createLifecyclePrismaClient(databaseUrl);
  try {
    await prisma.$connect();
    await resetLifecycleDatabase(prisma);
    const result = await prisma.$queryRaw<[{ ok: number }]>`SELECT 1 AS ok`;
    assert.equal(result[0]?.ok, 1);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  assert.equal(getLifecycleTestDbConfig({}).shouldRun, false);
  assert.throws(() => assertSafeLifecycleDatabaseUrl('not-a-url'), /valid PostgreSQL/);
  assert.throws(() => assertSafeLifecycleDatabaseUrl('mysql://localhost/golara_e2e'), /postgres/);
  assert.throws(() => assertSafeLifecycleDatabaseUrl('postgresql://db.example.com/golara_production'), /production or staging/);
  assert.throws(() => assertSafeLifecycleDatabaseUrl('postgresql://db.example.com/golara'), /local or clearly marked/);
  assert.doesNotThrow(() => assertSafeLifecycleDatabaseUrl('postgresql://localhost/golara'));
  assert.doesNotThrow(() => assertSafeLifecycleDatabaseUrl('postgresql://db.example.com/golara_e2e'));

  const config = getLifecycleTestDbConfig();
  if (!config.shouldRun) {
    console.log(config.reason);
    return;
  }

  await runLifecycleDatabaseHarnessSmoke(config.databaseUrl);
  console.log('lifecycle local database E2E harness passed');
}

main().catch((error) => {
  console.error(error);
  throw error;
});
