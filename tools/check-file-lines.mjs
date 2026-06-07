import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_LINES = Number.parseInt(process.env.MAX_FILE_LINES ?? '1000', 10);
const ROOT = process.cwd();
const CHECKED_EXTENSIONS = new Set([
  '.css',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mjs',
  '.prisma',
  '.ts',
  '.tsx'
]);
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  'coverage',
  'node_modules',
  'public/uploads'
]);
const IGNORED_FILES = new Set([
  'package-lock.json'
]);
const LEGACY_OVERSIZED_FILES = new Set([
  // Existing HTTP API lifecycle harness; new API E2E coverage should live in focused modules.
  'tests/e2e/api/run-tests.ts'
]);

function relativePath(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, '/');
}

function shouldIgnoreDirectory(dirPath) {
  const relative = relativePath(dirPath);
  return IGNORED_DIRECTORIES.has(relative) || relative.split('/').some((part) => IGNORED_DIRECTORIES.has(part));
}

function shouldCheckFile(filePath) {
  const relative = relativePath(filePath);
  return !IGNORED_FILES.has(relative) && CHECKED_EXTENSIONS.has(path.extname(filePath));
}

async function walk(dirPath, files = []) {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!shouldIgnoreDirectory(entryPath)) {
        await walk(entryPath, files);
      }
    } else if (entry.isFile() && shouldCheckFile(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

function countLines(content) {
  if (!content) return 0;
  return content.split('\n').length;
}

const files = await walk(ROOT);
const oversized = [];
const legacyOversized = [];
const largest = [];

for (const filePath of files) {
  const content = await readFile(filePath, 'utf8');
  const lines = countLines(content);
  const relative = relativePath(filePath);
  largest.push({ relative, lines });
  if (lines > MAX_LINES) {
    if (LEGACY_OVERSIZED_FILES.has(relative)) {
      legacyOversized.push({ relative, lines });
    } else {
      oversized.push({ relative, lines });
    }
  }
}

largest.sort((a, b) => b.lines - a.lines);

console.log(`Checked ${files.length} files. Maximum allowed lines per file: ${MAX_LINES}.`);
console.log('Largest files:');
for (const item of largest.slice(0, 10)) {
  console.log(`- ${item.relative}: ${item.lines}`);
}

if (legacyOversized.length > 0) {
  console.warn('\nLegacy files over the line-count budget:');
  for (const item of legacyOversized) {
    console.warn(`- ${item.relative}: ${item.lines} lines`);
  }
  console.warn('\nThese files are grandfathered only so focused follow-up modules can land safely.');
}

if (oversized.length > 0) {
  console.error('\nFiles over the line-count budget:');
  for (const item of oversized) {
    console.error(`- ${item.relative}: ${item.lines} lines`);
  }
  console.error('\nSplit large files into focused modules before merging.');
  process.exit(1);
}
