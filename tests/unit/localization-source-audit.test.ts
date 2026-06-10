import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

type AllowlistEntry = {
  pattern: string;
  reason: string;
  regex: RegExp;
};

type RawEnglishFinding = {
  file: string;
  line: number;
  text: string;
};

const AUDIT_ALLOWLIST_PATH = 'tests/fixtures/localization-source-audit-allowlist.txt';

const TARGET_ROOTS = ['app', 'components/admin', 'components/storefront'] as const;

function toPosixPath(value: string) {
  return value.split(path.sep).join('/');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function globToRegExp(pattern: string) {
  const parts = pattern.split('**').map((part) => part.split('*').map(escapeRegExp).join('[^/]*'));
  return new RegExp(`^${parts.join('.*')}$`);
}

function parseAllowlist(content: string) {
  const entries: AllowlistEntry[] = [];
  const errors: string[] = [];

  for (const [index, rawLine] of content.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const [pattern, ...reasonParts] = line.split('::').map((part) => part.trim());
    const reason = reasonParts.join('::').trim();

    if (!pattern || !reason) {
      errors.push(`line ${index + 1} must use \"glob :: reason\" with a non-empty reason`);
      continue;
    }

    entries.push({ pattern, reason, regex: globToRegExp(pattern) });
  }

  assert.deepEqual(errors, [], `Invalid ${AUDIT_ALLOWLIST_PATH}:\n${errors.join('\n')}`);
  return entries;
}

function isTargetFile(file: string) {
  const normalized = toPosixPath(file);
  if (!normalized.endsWith('.tsx')) return false;
  if (normalized.startsWith('app/')) {
    return /\/(page|loading|error)\.tsx$/.test(normalized) || /^(app\/(page|loading|error)\.tsx)$/.test(normalized);
  }
  return normalized.startsWith('components/admin/') || normalized.startsWith('components/storefront/');
}

function collectFiles(root: string): string[] {
  if (!existsSync(root)) return [];

  const results: string[] = [];
  const pending = [root];

  while (pending.length) {
    const current = pending.pop();
    if (!current) continue;

    const stats = statSync(current);
    if (stats.isDirectory()) {
      for (const child of readdirSync(current)) {
        if (child === 'node_modules' || child === '.next') continue;
        pending.push(path.join(current, child));
      }
      continue;
    }

    if (stats.isFile() && isTargetFile(current)) results.push(toPosixPath(current));
  }

  return results.sort();
}

function lineNumberForIndex(content: string, index: number) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function hasEnglishLetters(value: string) {
  return /[A-Za-z]/.test(value);
}

function looksLikeCopy(value: string) {
  const normalized = normalizeText(value);
  if (!normalized || !hasEnglishLetters(normalized)) return false;
  if (/^[A-Z0-9_./:@#${}()\-\s]+$/.test(normalized)) return false;
  if (/^(https?:|mailto:|tel:|\/|#)/.test(normalized)) return false;
  if (/^[a-z0-9-]+$/.test(normalized)) return false;
  return true;
}

function stripCodeBlocks(content: string) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
}

function findRawEnglishCopy(file: string): RawEnglishFinding[] {
  const content = readFileSync(file, 'utf8');
  const source = stripCodeBlocks(content);
  const findings: RawEnglishFinding[] = [];

  const jsxTextPattern = />\s*([^<{][^<{]*?[A-Za-z][^<{]*?)\s*</g;
  for (const match of source.matchAll(jsxTextPattern)) {
    const text = normalizeText(match[1] ?? '');
    if (!looksLikeCopy(text)) continue;
    findings.push({ file, line: lineNumberForIndex(source, match.index ?? 0), text });
  }

  const stringPropPattern = /\b(?:aria-label|alt|placeholder|title)=(['\"])([^'\"]*[A-Za-z][^'\"]*)\1/g;
  for (const match of source.matchAll(stringPropPattern)) {
    const text = normalizeText(match[2] ?? '');
    if (!looksLikeCopy(text)) continue;
    findings.push({ file, line: lineNumberForIndex(source, match.index ?? 0), text });
  }

  return findings;
}

function isAllowlisted(file: string, allowlist: AllowlistEntry[]) {
  return allowlist.some((entry) => entry.regex.test(file));
}

export function runLocalizationSourceAuditTests() {
  const allowlistContent = readFileSync(AUDIT_ALLOWLIST_PATH, 'utf8');
  const allowlist = parseAllowlist(allowlistContent);
  const files = TARGET_ROOTS.flatMap((root) => collectFiles(root));
  const auditedFiles = files.filter((file) => !isAllowlisted(file, allowlist));
  const findings = auditedFiles.flatMap((file) => findRawEnglishCopy(file));

  assert.ok(files.length > 0, 'localization source audit should discover frontend/admin files');
  assert.ok(allowlist.length > 0, 'localization source audit allowlist should document current pending scopes');
  assert.ok(
    allowlist.every((entry) => entry.reason.length >= 20),
    'each localization source audit allowlist entry should explain why raw English is temporarily allowed'
  );
  assert.deepEqual(
    findings,
    [],
    `Raw English UI copy found in audited files. Move copy into a localization bundle or add a narrow allowlist entry with a reason.\n${findings
      .map((finding) => `${finding.file}:${finding.line} ${JSON.stringify(finding.text)}`)
      .join('\n')}`
  );

  console.log('localization-source-audit.test.ts passed');
}
