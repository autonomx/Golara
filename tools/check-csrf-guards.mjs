#!/usr/bin/env node

import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Recursively collect all .ts files under a directory
function walk(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  }
  return results;
}

// Target Next.js server action files under the app directory
const rootDir = 'app';
const actionFiles = walk(rootDir).filter((file) => file.endsWith('/actions.ts'));

const failures = [];
for (const file of actionFiles) {
  const source = readFileSync(file, 'utf8');
  // Only enforce guards on server actions marked with "use server" directive
  if (!/['"]use server['"]/.test(source)) continue;
  const exportedFunctions = [...source.matchAll(/export\s+async\s+function\s+([a-zA-Z0-9_]+)/g)];
  if (exportedFunctions.length === 0) continue;
  // Check for either a same-origin guard or an admin-auth guard
  const hasGuard = /assertSameOriginServerAction\s*\(/.test(source) ||
                   /assertAdminRole\s*\(/.test(source) ||
                   /assertAdminAuthenticated\s*\(/.test(source);
  if (!hasGuard) {
    failures.push(`${file}: exported server actions missing assertSameOriginServerAction or assertAdminRole`);
  }
}

if (failures.length > 0) {
  console.error('CSRF guard check failed:');
  for (const fail of failures) console.error(`- ${fail}`);
  process.exit(1);
} else {
  console.log(`CSRF guard check passed (${actionFiles.length} files scanned).`);
}
