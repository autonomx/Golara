import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ADMIN_ROUTE_ERROR_COMPONENT = 'components/admin/AdminRouteError.tsx';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function includes(content: string, expected: string, message: string) {
  assert.ok(content.includes(expected), message);
}

export function runAdminRouteErrorComponentSourceGuardTests() {
  const content = source(ADMIN_ROUTE_ERROR_COMPONENT);

  includes(
    content,
    "import { createAdminRouteErrorTranslator } from '@/lib/localization/admin-route-error-copy';",
    'AdminRouteError should use the shared admin route-error copy helper.'
  );
  includes(content, 'const t = useMemo(() => createAdminRouteErrorTranslator(locale), [locale]);', 'AdminRouteError should memoize the route-error translator.');
  includes(content, "title = 'Admin module error'", 'AdminRouteError should keep a dictionary-backed default title key.');
  includes(content, "{t('Module error')}", 'AdminRouteError eyebrow copy should be translated.');
  includes(content, '{t(title)}', 'AdminRouteError title prop should be translated.');
  includes(
    content,
    "{t('This admin section could not load. Try again, or check the server logs if the problem repeats.')}",
    'AdminRouteError body copy should be translated.'
  );
  includes(content, "t('Unknown error')", 'AdminRouteError unknown-error fallback should be translated.');
  includes(content, "{t('Retry')}", 'AdminRouteError retry action should be translated.');
  includes(content, "{t('Back to overview')}", 'AdminRouteError back action should be translated.');

  console.log('admin-route-error-component-source-guard.test.ts passed');
}
