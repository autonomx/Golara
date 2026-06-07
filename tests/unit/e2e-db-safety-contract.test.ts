import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertSafeLifecycleDatabaseUrl, getLifecycleTestDbConfig } from '@/tests/e2e/lifecycle/test-db';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertThrowsMessage(fn: () => unknown, expected: RegExp) {
  assert.throws(fn, expected);
}

export async function runE2eDbSafetyContractTests() {
  assert.equal(getLifecycleTestDbConfig({}).shouldRun, false);
  assert.equal(getLifecycleTestDbConfig({ E2E_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/golara_e2e' }).shouldRun, true);

  assertThrowsMessage(
    () => assertSafeLifecycleDatabaseUrl('postgresql://postgres:postgres@localhost:5432/golara_e2e', 'postgresql://postgres:postgres@localhost:5432/golara_e2e'),
    /must not match DATABASE_URL/
  );
  assertThrowsMessage(
    () => assertSafeLifecycleDatabaseUrl('mysql://postgres:postgres@localhost:5432/golara_e2e'),
    /must use postgres:\/\/ or postgresql:\/\//
  );
  assertThrowsMessage(
    () => assertSafeLifecycleDatabaseUrl('postgresql://postgres:postgres@db.example.com:5432/golara'),
    /unless the database is local or clearly marked as test\/e2e/
  );
  assertThrowsMessage(
    () => assertSafeLifecycleDatabaseUrl('postgresql://postgres:postgres@localhost:5432/golara_production'),
    /looks like production or staging/
  );

  const harness = source('tests/e2e/lifecycle/test-db.ts');
  assert.match(harness, /assertLifecycleSchemaReady/);
  assert.match(harness, /REQUIRED_LIFECYCLE_TABLES/);
  assert.match(harness, /E2E database schema is not ready/);
  assert.match(harness, /Missing required tables/);
  assert.match(harness, /npm run db:push/);
  assert.match(harness, /\$env:DATABASE_URL=\$env:E2E_DATABASE_URL/);
  assert.match(harness, /resetLifecycleDatabase\(prisma: PrismaClient\) \{\r?\n  await assertLifecycleSchemaReady\(prisma\)/);

  console.log('e2e-db-safety-contract.test.ts passed');
}
