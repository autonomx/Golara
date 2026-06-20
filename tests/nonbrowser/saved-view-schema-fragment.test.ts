import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export async function runSavedViewSchemaFragmentTests() {
  const fragment = await readFile('prisma/schema.admin-analytics-saved-view.prisma', 'utf8');
  const migration = await readFile(
    'prisma/migrations/202606190874_admin_analytics_saved_view_storage/migration.sql',
    'utf8'
  );

  assert.match(fragment, /model AdminAnalyticsSavedView/);
  assert.match(fragment, /viewKey\s+String/);
  assert.match(fragment, /label\s+String/);
  assert.match(fragment, /scope\s+String/);
  assert.match(fragment, /audience\s+String/);
  assert.match(fragment, /rangeQuery\s+String/);
  assert.match(fragment, /sectionAnchors\s+Json\s+@default\("\[\]"\)/);
  assert.match(fragment, /ownerApproved\s+Boolean\s+@default\(false\)/);
  assert.match(fragment, /isActive\s+Boolean\s+@default\(false\)/);
  assert.match(fragment, /metadata\s+Json\s+@default\("\{\}"\)/);
  assert.match(fragment, /@@unique\(\[viewKey, scope\]\)/);
  assert.match(fragment, /@@index\(\[ownerApproved, isActive\]\)/);

  for (const column of [
    '"viewKey" TEXT NOT NULL',
    '"label" TEXT NOT NULL',
    '"scope" TEXT NOT NULL',
    '"audience" TEXT NOT NULL',
    '"rangeQuery" TEXT NOT NULL',
    '"ownerApproved" BOOLEAN NOT NULL DEFAULT false',
    '"isActive" BOOLEAN NOT NULL DEFAULT false'
  ]) {
    assert.ok(migration.includes(column), `migration should contain ${column}`);
  }

  assert.doesNotMatch(fragment, /customerRows|eventRows|exportContents|recipientLists/);
  assert.doesNotMatch(fragment, /sendMail|createTransport|fetch\(|axios|setInterval|setTimeout|cron|worker\.|queue\./);
}
