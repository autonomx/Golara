#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dashboardPath = resolve('components/admin/AdminDashboard.tsx');
let source = readFileSync(dashboardPath, 'utf8');

if (source.includes("import { AdminCatalogWorkspace } from '@/components/admin/AdminCatalogWorkspace';")) {
  console.log('AdminDashboard workspace swap already applied.');
  process.exit(0);
}

function requireIncludes(label, needle) {
  if (!source.includes(needle)) {
    throw new Error(`AdminDashboard workspace swap aborted: missing ${label}`);
  }
}

function replaceOnce(label, needle, replacement) {
  requireIncludes(label, needle);
  source = source.replace(needle, replacement);
}

replaceOnce(
  'dashboard import anchor',
  "import { createAdminTranslator } from '@/lib/localization/admin-copy';\n",
  "import { createAdminTranslator } from '@/lib/localization/admin-copy';\nimport { AdminOverviewWorkspace } from '@/components/admin/AdminOverviewWorkspace';\nimport { AdminCatalogWorkspace } from '@/components/admin/AdminCatalogWorkspace';\nimport { AdminContentWorkspace } from '@/components/admin/AdminContentWorkspace';\n"
);

const returnStart = "      <StatusBanner status={status} message={message} t={t} />\n      <DashboardIntro workspace={activeWorkspace} productCount={products.length} categoryCount={categories.length} mediaCount={media.length} t={t} />";
const returnEnd = "      {showProductSection ? <section id=\"products\"";
const startIndex = source.indexOf(returnStart);
const endIndex = source.indexOf(returnEnd, startIndex);

if (startIndex === -1 || endIndex === -1) {
  throw new Error('AdminDashboard workspace swap aborted: unable to locate dashboard workspace render block');
}

const before = source.slice(0, startIndex);
const after = source.slice(endIndex);
const productSectionEnd = after.indexOf("\n    </div>\n  );\n}", 0);

if (productSectionEnd === -1) {
  throw new Error('AdminDashboard workspace swap aborted: unable to locate end of product workspace render block');
}

const afterProductSection = after.slice(productSectionEnd);

const workspaceRender = `      <StatusBanner status={status} message={message} t={t} />
      <DashboardIntro workspace={activeWorkspace} productCount={products.length} categoryCount={categories.length} mediaCount={media.length} t={t} />
      {showOverview ? <AdminOverviewWorkspace runtimeReadiness={runtimeReadiness} authConfigured={authConfigured} authenticated={authenticated} notificationReadiness={notificationReadiness} notificationRetryRunbook={notificationRetryRunbook} checkoutReadiness={checkoutReadiness} authEventSummary={authEventSummary} locale={locale} /> : null}
      {showCatalog ? <AdminCatalogWorkspace catalogSection={catalogSection} categories={categories} products={products} productTypes={productTypes} media={media} disabled={disabled} catalogSearch={catalogSearch} catalogCategory={catalogCategory} catalogFlag={catalogFlag} productPage={productPage} categoryPage={categoryPage} mediaPage={mediaPage} productColumns={productColumns} mediaColumns={mediaColumns} locale={locale} t={t} /> : null}
      {showContent ? <AdminContentWorkspace homepage={homepage} homepageTranslations={homepageTranslations} categories={categories} products={products} disabled={disabled} authenticated={authenticated} locale={locale} t={t} /> : null}`;

source = `${before}${workspaceRender}${afterProductSection}`;

const unusedImportPatterns = [
  "import Image from 'next/image';\n",
  "import Link from 'next/link';\n",
  "import { logoutAction } from '@/app/admin/logout/actions';\n",
  "import { AdminReadinessPanel } from '@/components/admin/AdminReadinessPanel';\n",
  "import { AdminSecurityPanel } from '@/components/admin/AdminSecurityPanel';\n",
  "import { AdminTranslationPanel } from '@/components/admin/AdminTranslationPanel';\n",
  "import { MediaSelectWithPreview } from '@/components/admin/MediaSelectWithPreview';\n",
  "import { homepageBannerSlides, homepageBestSellerImage, homepageCategoryImage } from '@/lib/homepage-assets';\n"
];

for (const pattern of unusedImportPatterns) {
  source = source.replace(pattern, '');
}

source = source.replace(/import \{[\s\S]*?\} from '@\/app\/admin\/actions';\n/, '');
source = source.replace(
  "import type { Category, HomepageContent, HomepageTranslation, MediaItem, Product, ProductType } from '@/lib/catalog';",
  "import type { Category, HomepageContent, HomepageTranslation, MediaItem, Product, ProductType } from '@/lib/catalog';"
);

writeFileSync(dashboardPath, source);
console.log('AdminDashboard workspace swap applied. Run typecheck and the localization/unit suites before committing.');
