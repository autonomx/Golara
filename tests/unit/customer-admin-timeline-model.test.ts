import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'prisma/migrations/20260602070000_add_customer_admin_timeline/migration.sql';
const schemaPath = 'prisma/schema.prisma';

export async function runCustomerAdminTimelineModelTests() {
  const migration = readFileSync(migrationPath, 'utf8');
  const schema = readFileSync(schemaPath, 'utf8');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "CustomerAdminTimelineEvent"/);
  assert.match(migration, /"customerId" TEXT NOT NULL/);
  assert.match(migration, /"type" TEXT NOT NULL DEFAULT 'staff_note'/);
  assert.match(migration, /"actorLabel" TEXT NOT NULL DEFAULT 'Admin'/);
  assert.match(migration, /"CustomerAdminTimelineEvent_customerId_createdAt_idx"/);
  assert.match(migration, /"CustomerAdminTimelineEvent_customerId_fkey"/);
  assert.match(migration, /REFERENCES "CustomerProfile"\("id"\) ON DELETE CASCADE/);

  assert.match(schema, /timelineEvents\s+CustomerAdminTimelineEvent\[\]/);
  assert.match(schema, /model CustomerAdminTimelineEvent \{/);
  assert.match(schema, /customer\s+CustomerProfile\s+@relation\(fields: \[customerId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /type\s+String\s+@default\("staff_note"\)/);
  assert.match(schema, /actorLabel\s+String\s+@default\("Admin"\)/);
  assert.match(schema, /metadata\s+Json\?/);
  assert.match(schema, /@@index\(\[customerId, createdAt\]\)/);
  assert.match(schema, /@@index\(\[type, createdAt\]\)/);

  console.log('customer-admin-timeline-model.test.ts passed');
}
