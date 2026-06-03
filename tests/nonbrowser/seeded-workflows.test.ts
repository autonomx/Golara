import assert from 'node:assert/strict';
import { withIsolatedPrisma } from '../utils/isolated-test-db';

export async function runSeededWorkflowTests() {
  await withIsolatedPrisma(async (client, testKey) => {
    const importJobId = `${testKey}_import_job`;
    const webhookKey = `${testKey}_webhook`;
    const integrationKey = `${testKey}_integration`;

    await client.$executeRaw`
      INSERT INTO "WebhookConfiguration" ("key", "label", "targetUrl", "eventTypes", "isActive", "createdAt", "updatedAt")
      VALUES (${webhookKey}, ${testKey}, 'https://example.com/test-hook', '[]'::jsonb, true, NOW(), NOW())
    `;
    await client.$executeRaw`
      INSERT INTO "IntegrationAppRegistry" ("key", "label", "category", "status", "permissions", "requiredEnvVars", "isInternal", "isActive", "createdAt", "updatedAt")
      VALUES (${integrationKey}, ${testKey}, 'webhook', 'active', '[]'::jsonb, '[]'::jsonb, true, true, NOW(), NOW())
    `;
    await client.$executeRaw`
      INSERT INTO "ImportExportJob" ("id", "kind", "target", "status", "requestedBy", "createdAt", "updatedAt")
      VALUES (${importJobId}, 'import', 'products', 'queued', ${testKey}, NOW(), NOW())
    `;

    const rows = await client.$queryRaw<Array<{ job_id: string; hook_key: string; app_key: string }>>`
      SELECT j."id" as job_id, w."key" as hook_key, i."key" as app_key
      FROM "ImportExportJob" j
      CROSS JOIN "WebhookConfiguration" w
      CROSS JOIN "IntegrationAppRegistry" i
      WHERE j."id" = ${importJobId}
        AND w."key" = ${webhookKey}
        AND i."key" = ${integrationKey}
      LIMIT 1
    `;

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.job_id, importJobId);
    assert.equal(rows[0]?.hook_key, webhookKey);
    assert.equal(rows[0]?.app_key, integrationKey);
  });
  console.log('seeded-workflows.test.ts passed');
}
