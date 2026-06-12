#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  'coverage',
  'node_modules',
  'playwright-report',
  'test-results'
]);

const IGNORED_FILES = new Set([
  '.env.example',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock'
]);

const SCANNED_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.env',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.prisma',
  '.sh',
  '.sql',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml'
]);

export const SECRET_PATTERNS = [
  { name: 'private-key-block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { name: 'aws-access-key', pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/ },
  { name: 'github-token', pattern: /\bgh(?:p|o|u|s|r)_[A-Za-z0-9_]{36,}\b/ },
  { name: 'stripe-secret-key', pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { name: 'stripe-webhook-secret', pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/ },
  { name: 'slack-token', pattern: /\bxox(?:b|p|a|r|s)-[A-Za-z0-9-]{20,}\b/ }
];

function extensionOf(path) {
  const match = /\.[^.\/]+$/.exec(path);
  return match ? match[0] : '';
}

export function shouldScanPath(path) {
  const normalized = path.replace(/\\/g, '/');
  const basename = normalized.split('/').pop() || '';
  if (IGNORED_FILES.has(basename)) return false;
  if (normalized.includes('/.env.example')) return false;
  return SCANNED_EXTENSIONS.has(extensionOf(normalized));
}

function collectFiles(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (IGNORED_DIRECTORIES.has(entry)) continue;
    const absolute = join(directory, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      collectFiles(absolute, files);
      continue;
    }
    if (!stats.isFile()) continue;
    const repoPath = relative(ROOT, absolute).replace(/\\/g, '/');
    if (shouldScanPath(repoPath)) files.push(repoPath);
  }
  return files;
}

export function scanContent(content, filePath = '<memory>') {
  const findings = [];
  for (const { name, pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(content);
    if (!match) continue;
    const before = content.slice(0, match.index);
    const line = before.split('\n').length;
    findings.push({ filePath, line, pattern: name });
  }
  return findings;
}

export function scanRepository(root = ROOT) {
  const findings = [];
  for (const filePath of collectFiles(root)) {
    const content = readFileSync(join(root, filePath), 'utf8');
    findings.push(...scanContent(content, filePath));
  }
  return findings;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = scanRepository(ROOT);
  if (findings.length > 0) {
    console.error('Potential committed secrets detected:');
    for (const finding of findings) {
      console.error(`- ${finding.filePath}:${finding.line} matched ${finding.pattern}`);
    }
    process.exit(1);
  }
  console.log('check-secrets.mjs passed');
}
