import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const shellSource = readFileSync(join(repoRoot, 'components/admin/AdminPageShell.tsx'), 'utf8');
const loginSource = readFileSync(join(repoRoot, 'app/admin/login/page.tsx'), 'utf8');
const shellFunctionSource = shellSource.slice(shellSource.indexOf('export function AdminPageShell'));

const consoleRoutePages = [
  'app/admin/page.tsx',
  'app/admin/categories/page.tsx',
  'app/admin/products/page.tsx',
  'app/admin/discounts/page.tsx',
  'app/admin/audit/page.tsx',
  'app/admin/translations/page.tsx',
  'app/admin/staff-access/page.tsx',
  'app/admin/customers/page.tsx',
  'app/admin/settings/page.tsx',
  'app/admin/orders/page.tsx',
  'app/admin/inquiries/page.tsx',
  'app/admin/readiness/page.tsx'
];

export async function runAdminPageShellAuthBoundaryTests() {
  assert.ok(shellSource.includes("import { redirect } from 'next/navigation';"), 'AdminPageShell must import Next redirect for server-side auth boundary enforcement');
  assert.ok(shellFunctionSource.includes("if (!props.authenticated) redirect('/admin/login');"), 'AdminPageShell must redirect unauthenticated dedicated admin pages to /admin/login before rendering shell content');
  assert.ok(shellFunctionSource.indexOf("if (!props.authenticated) redirect('/admin/login');") < shellFunctionSource.indexOf('return ('), 'AdminPageShell auth redirect must run before rendering admin navigation or children');
  assert.ok(shellSource.includes('authConfigured') && shellSource.includes('props.authenticated'), 'AdminPageShell must keep explicit auth state props for authenticated shell rendering');

  for (const relativePath of consoleRoutePages) {
    const routeSource = readFileSync(join(repoRoot, relativePath), 'utf8');
    assert.ok(routeSource.includes("import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';"), `${relativePath} must import the admin route auth boundary`);
    assert.ok(routeSource.includes('await requireAdminRouteSession();'), `${relativePath} must require an admin session before rendering the console route`);
    assert.ok(routeSource.indexOf('await requireAdminRouteSession();') < routeSource.indexOf('<AdminConsolePage'), `${relativePath} must guard before rendering AdminConsolePage`);
  }

  assert.ok(loginSource.includes('isAdminAuthenticated()'), 'admin login page must remain the public admin entry that checks existing sessions');
  assert.ok(loginSource.includes("redirect('/admin')"), 'admin login page must redirect already-authenticated users back to the admin console');
  assert.ok(!loginSource.includes('AdminPageShell'), 'admin login page must not use the protected AdminPageShell boundary');

  console.log('admin-page-shell-auth-boundary.test.ts passed');
}
