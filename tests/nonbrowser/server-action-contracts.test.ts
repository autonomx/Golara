import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) return walk(path);
    return [path.replace(/\\/g, '/')];
  });
}

export async function runServerActionContractTests() {
  const actionFiles = walk('app').filter((file) => /actions?\.ts$/.test(file));
  assert.ok(actionFiles.includes('app/admin/order-actions.ts'));
  assert.ok(actionFiles.includes('app/admin/settings/actions.ts'));

  for (const file of actionFiles) {
    const content = source(file);
    assert.match(content, /'use server'|"use server"/, `${file} should use server action mode`);
    if (/export async function/.test(content)) {
      assert.match(content, /FormData|redirect|revalidatePath|return/, `${file} should expose a concrete action contract`);
    }
  }

  const orderActions = source('app/admin/order-actions.ts');
  assert.match(orderActions, /updateOrderDiscountAction/);
  assert.match(orderActions, /isAdminOrderLineEditable/);
  assert.match(orderActions, /recordAdminAuditLog/);

  const settingsActions = source('app/admin/settings/actions.ts');
  assert.match(settingsActions, /updateStoreSettingsAction/);
  assert.match(settingsActions, /updatePaymentProviderSettingsAction/);
  assert.match(settingsActions, /updateNotificationProviderSettingsAction/);
  assert.match(settingsActions, /recordAdminAuditLog|Service\.update/);

  console.log('server-action-contracts.test.ts passed');
}
