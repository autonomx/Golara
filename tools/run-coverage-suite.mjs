import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const coverageRoot = join(root, 'coverage');
const v8Dir = join(coverageRoot, 'v8');
const summaryJson = join(coverageRoot, 'coverage-summary.json');
const summaryMarkdown = join(coverageRoot, 'coverage-summary.md');

function normalizePath(path) {
  return path.split(sep).join('/');
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return [path];
  });
}

function filePathFromUrl(url) {
  if (!url.startsWith('file://')) return null;
  try {
    return resolve(fileURLToPath(url));
  } catch {
    return null;
  }
}

function shouldIncludeFile(path) {
  const rel = normalizePath(relative(root, path));
  if (rel.startsWith('..')) return false;
  if (rel.includes('/node_modules/')) return false;
  if (rel.startsWith('node_modules/')) return false;
  if (rel.startsWith('.next/')) return false;
  if (rel.startsWith('coverage/')) return false;
  if (rel.startsWith('prisma/generated/')) return false;
  if (!/\.(ts|tsx|js|mjs|cjs)$/.test(rel)) return false;
  return ['app/', 'components/', 'lib/', 'tools/', 'tests/'].some((prefix) => rel.startsWith(prefix));
}

function bucketFor(path) {
  const rel = normalizePath(relative(root, path));
  return rel.split('/')[0] || 'root';
}

function emptyBucket() {
  return { files: 0, functions: 0, coveredFunctions: 0, bytes: 0, coveredBytes: 0 };
}

function mergeBucket(target, delta) {
  target.files += delta.files;
  target.functions += delta.functions;
  target.coveredFunctions += delta.coveredFunctions;
  target.bytes += delta.bytes;
  target.coveredBytes += delta.coveredBytes;
}

function pct(covered, total) {
  if (!total) return 100;
  return Math.round((covered / total) * 10000) / 100;
}

function analyzeScript(script) {
  const functions = script.functions || [];
  let byteTotal = 0;
  let byteCovered = 0;
  let functionTotal = 0;
  let functionCovered = 0;

  for (const fn of functions) {
    functionTotal += 1;
    let hasCoverage = false;
    for (const range of fn.ranges || []) {
      const span = Math.max(0, Number(range.endOffset || 0) - Number(range.startOffset || 0));
      byteTotal += span;
      if (Number(range.count || 0) > 0) {
        byteCovered += span;
        hasCoverage = true;
      }
    }
    if (hasCoverage) functionCovered += 1;
  }

  return { files: 1, functions: functionTotal, coveredFunctions: functionCovered, bytes: byteTotal, coveredBytes: byteCovered };
}

function runSuite() {
  rmSync(coverageRoot, { recursive: true, force: true });
  mkdirSync(v8Dir, { recursive: true });

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npm, ['run', 'test:all'], {
    cwd: root,
    env: { ...process.env, NODE_V8_COVERAGE: v8Dir },
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}

function buildSummary() {
  const files = listFiles(v8Dir).filter((file) => file.endsWith('.json'));
  if (files.length === 0) throw new Error('coverage runner produced no V8 coverage JSON files');

  const byFile = new Map();
  const byBucket = new Map();
  const total = emptyBucket();

  for (const file of files) {
    const payload = JSON.parse(readFileSync(file, 'utf8'));
    for (const script of payload.result || []) {
      const path = filePathFromUrl(script.url || '');
      if (!path || !shouldIncludeFile(path) || !existsSync(path) || !statSync(path).isFile()) continue;

      const rel = normalizePath(relative(root, path));
      const current = byFile.get(rel) || emptyBucket();
      const delta = analyzeScript(script);
      mergeBucket(current, delta);
      byFile.set(rel, current);
    }
  }

  if (byFile.size === 0) throw new Error('coverage runner found no project source coverage entries');

  for (const [rel, data] of byFile.entries()) {
    mergeBucket(total, data);
    const bucket = bucketFor(join(root, rel));
    const current = byBucket.get(bucket) || emptyBucket();
    mergeBucket(current, data);
    byBucket.set(bucket, current);
  }

  const buckets = Object.fromEntries([...byBucket.entries()].sort().map(([name, data]) => [name, {
    files: data.files,
    functionCoverage: pct(data.coveredFunctions, data.functions),
    byteCoverage: pct(data.coveredBytes, data.bytes)
  }]));

  return {
    generatedAt: new Date().toISOString(),
    files: byFile.size,
    functionCoverage: pct(total.coveredFunctions, total.functions),
    byteCoverage: pct(total.coveredBytes, total.bytes),
    totals: total,
    buckets
  };
}

function writeSummary(summary) {
  mkdirSync(coverageRoot, { recursive: true });
  writeFileSync(summaryJson, `${JSON.stringify(summary, null, 2)}\n`);

  const lines = [
    '# Coverage Summary',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    `- Files: ${summary.files}`,
    `- Function coverage: ${summary.functionCoverage}%`,
    `- Byte coverage: ${summary.byteCoverage}%`,
    '',
    '## Buckets',
    '',
    '| Bucket | Files | Function coverage | Byte coverage |',
    '| --- | ---: | ---: | ---: |'
  ];

  for (const [bucket, data] of Object.entries(summary.buckets)) {
    lines.push(`| ${bucket} | ${data.files} | ${data.functionCoverage}% | ${data.byteCoverage}% |`);
  }

  writeFileSync(summaryMarkdown, `${lines.join('\n')}\n`);
  console.log(`Coverage summary written to ${normalizePath(relative(root, summaryJson))}`);
  console.log(`Coverage markdown written to ${normalizePath(relative(root, summaryMarkdown))}`);
  console.log(`Function coverage: ${summary.functionCoverage}%`);
  console.log(`Byte coverage: ${summary.byteCoverage}%`);
}

runSuite();
writeSummary(buildSummary());
