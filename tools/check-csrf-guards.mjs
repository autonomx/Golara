#!/usr/bin/env node

import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function walk(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  return results;
}

export function isServerActionSource(source) {
  return /^\s*['"]use server['"];?/m.test(source);
}

export function hasExportedAsyncAction(source) {
  return /export\s+async\s+function\s+[a-zA-Z0-9_]+/.test(source);
}

export function hasMutationBoundary(source) {
  return /assertSameOriginServerAction\s*\(/.test(source) ||
    /assertAdminRole\s*\(/.test(source) ||
    /assertAdminAuthenticated\s*\(/.test(source) ||
    /verifyApiToken\s*\(/.test(source) ||
    /validatePaymentWebhookSignature\s*\(/.test(source);
}

export function collectCsrfGuardFailures({ rootDir = 'app', readFile = readFileSync, listFiles = walk } = {}) {
  const files = listFiles(rootDir)
    .filter((file) => file.startsWith('app/'))
    .filter((file) => !file.endsWith('.d.ts'));
  const failures = [];

  for (const file of files) {
    const source = readFile(file, 'utf8');
    if (!isServerActionSource(source)) continue;
    if (!hasExportedAsyncAction(source)) continue;
    if (!hasMutationBoundary(source)) {
      failures.push(`${file}: exported server actions missing assertSameOriginServerAction, assertAdminRole, assertAdminAuthenticated, verifyApiToken, or validated webhook signature boundary`);
    }
  }

  return { scannedFiles: files.length, failures };
}

export function runCsrfGuardCheck() {
  const { scannedFiles, failures } = collectCsrfGuardFailures();

  if (failures.length > 0) {
    console.error('CSRF guard check failed:');
    for (const fail of failures) console.error(`- ${fail}`);
    process.exit(1);
  }

  console.log(`CSRF guard check passed (${scannedFiles} files scanned).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCsrfGuardCheck();
}
