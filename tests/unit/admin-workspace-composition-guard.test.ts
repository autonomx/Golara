import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function includes(content: string, expected: string, message: string) {
  assert.ok(content.includes(expected), message);
}

export function runAdminWorkspaceCompositionGuardTests() {
  {
    const content = source('components/admin/AdminCatalogWorkspace.tsx');
    includes(content, "import { AdminCatalogControls }", 'catalog workspace should use extracted catalog controls');
    includes(content, "import { AdminCategorySection }", 'catalog workspace should use extracted category section');
    includes(content, "import { AdminMediaSection }", 'catalog workspace should use extracted media section');
    includes(content, "import { AdminProductSection }", 'catalog workspace should use extracted product section');
    includes(content, 'adminCatalogPath(catalogSection)', 'catalog workspace should use shared catalog path helper');
    includes(content, 'parseAdminCatalogColumns(productColumns', 'catalog workspace should use shared product column parser');
    includes(content, 'parseAdminCatalogColumns(mediaColumns', 'catalog workspace should use shared media column parser');
  }

  {
    const content = source('components/admin/AdminOverviewWorkspace.tsx');
    includes(content, "import { AdminCmsStatusPanel }", 'overview workspace should use extracted CMS status panel');
    includes(content, "import { AdminReadinessPanel }", 'overview workspace should preserve readiness panel');
    includes(content, "import { AdminSecurityPanel }", 'overview workspace should preserve security panel');
    includes(content, 'authenticated ? <AdminSecurityPanel', 'overview workspace should keep security gated by authentication');
    includes(content, '<AdminCmsStatusPanel databaseReady={databaseReady} authenticated={authenticated} t={t} />', 'overview workspace should pass CMS status state into the extracted panel');
  }

  {
    const content = source('components/admin/AdminContentWorkspace.tsx');
    includes(content, "import { AdminHomepageSection }", 'content workspace should use extracted homepage section');
    includes(content, 'homepageTranslations={homepageTranslations}', 'content workspace should pass homepage translations into the extracted section');
    includes(content, 'categories={categories}', 'content workspace should pass categories into the extracted section');
    includes(content, 'products={products}', 'content workspace should pass products into the extracted section');
    includes(content, 'authenticated={authenticated}', 'content workspace should pass authentication state into the extracted section');
    includes(content, 'locale={locale}', 'content workspace should pass locale into the extracted section');
  }

  console.log('admin-workspace-composition-guard.test.ts passed');
}
