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

function runServerOnlyBoundaryTests() {
  const files = walk('lib').filter((file) => file.endsWith('.ts'));
  for (const file of files) {
    const content = source(file);
    if (/from ['"]@\/lib\/prisma['"]|prisma\.|\$queryRaw|\$executeRaw/.test(content)) {
      assert.match(content, /import 'server-only'/, `${file} uses server data access and should import server-only`);
    }
  }
}

function runRawSqlSafetyTests() {
  const files = walk('lib').concat(walk('app')).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));
  const unsafe = files.filter((file) => {
    const content = source(file);
    return /\$queryRawUnsafe|\$executeRawUnsafe/.test(content);
  });
  assert.deepEqual(unsafe, [], `Production code should not use raw-unsafe Prisma calls: ${unsafe.join(', ')}`);
}

function runAdminActionBoundaryTests() {
  const actionFiles = walk('app/admin').filter((file) => /actions?\.ts$/.test(file));
  assert.ok(actionFiles.length > 0, 'admin action files should exist');
  for (const file of actionFiles) {
    const content = source(file);
    assert.match(content, /'use server'|"use server"/, `${file} should be a server action module`);
  }
}

export async function runStaticBoundaryTests() {
  runServerOnlyBoundaryTests();
  runRawSqlSafetyTests();
  runAdminActionBoundaryTests();
  console.log('static-boundary.test.ts passed');
}
