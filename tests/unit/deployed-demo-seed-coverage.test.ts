import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readRepoFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function assertIncludes(source: string, fragment: string) {
  if (!source.includes(fragment)) {
    throw new Error(`Expected source to include ${fragment}`);
  }
}

export function runDeployedDemoSeedCoverageTests() {
  const packageJson = readRepoFile('package.json');
  const seedOperations = readRepoFile('prisma/seed-demo-operations.ts');

  assertIncludes(packageJson, 'tsx prisma/seed-demo-operations.ts');

  for (const fragment of [
    'prisma.adminAccount.upsert',
    'demo-owner@golara.test',
    'demo-staff@golara.test',
    'demo-fulfillment@golara.test'
  ]) {
    assertIncludes(seedOperations, fragment);
  }

  for (const fragment of [
    'demo-settlement-paid-1001',
    'demo-settlement-pending-1002',
    'demo-settlement-failed-1003',
    'prisma.checkoutPaymentEvent.upsert',
    'prisma.paymentSettlementReconciliation.upsert',
    'planPaymentSettlementReconciliation'
  ]) {
    assertIncludes(seedOperations, fragment);
  }

  for (const fragment of [
    'demo.seed.staff',
    'demo.seed.settlements',
    'demo.seed.inquiries',
    'prisma.adminAuditLog.create'
  ]) {
    assertIncludes(seedOperations, fragment);
  }
}

runDeployedDemoSeedCoverageTests();
