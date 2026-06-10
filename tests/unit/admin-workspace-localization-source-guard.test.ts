import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

type RawEnglishFinding = {
  file: string;
  line: number;
  text: string;
};

const LOCALIZED_ADMIN_COMPONENT_FILES = [
  'components/admin/AdminOverviewWorkspace.tsx',
  'components/admin/AdminCatalogWorkspace.tsx',
  'components/admin/AdminContentWorkspace.tsx',
  'components/admin/AdminCatalogControls.tsx',
  'components/admin/AdminMediaSection.tsx',
  'components/admin/AdminCategorySection.tsx',
  'components/admin/AdminProductSection.tsx',
  'components/admin/AdminHomepageSection.tsx',
  'components/admin/AdminReadinessPanel.tsx',
  'components/admin/AdminSecurityPanel.tsx',
  'components/admin/AdminCmsStatusPanel.tsx',
  'components/admin/AdminFailedPaymentNotificationAlertsPanel.tsx',
  'components/admin/AdminTranslationPanel.tsx'
] as const;

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

export function runAdminWorkspaceLocalizationSourceGuardTests() {
  const findings = LOCALIZED_ADMIN_COMPONENT_FILES.flatMap((file) => findRawEnglishCopy(file));

  assert.deepEqual(
    findings,
    [],
    `Extracted admin workspace, section, overview panel, alert panel, and translation panel components should not introduce raw English UI copy. Route copy through admin localization helpers instead.\n${findings
      .map((finding) => `${finding.file}:${finding.line} ${JSON.stringify(finding.text)}`)
      .join('\n')}`
  );

  console.log('admin-workspace-localization-source-guard.test.ts passed');
}
