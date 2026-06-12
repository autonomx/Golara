import assert from 'node:assert/strict';
import {
  collectCsrfGuardFailures,
  hasExportedAsyncAction,
  hasMutationBoundary,
  isServerActionSource
} from '../../tools/check-csrf-guards.mjs';

const guardedAction = `'use server';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';
export async function updateThing(formData: FormData) {
  await assertSameOriginServerAction();
}
`;

const unguardedAction = `'use server';
export async function updateThing(formData: FormData) {
  return formData.get('name');
}
`;

const nonServerModule = `export async function updateThing() { return true; }`;

export async function runServerActionCsrfGateTests() {
  assert.equal(isServerActionSource(guardedAction), true);
  assert.equal(isServerActionSource(nonServerModule), false);
  assert.equal(hasExportedAsyncAction(guardedAction), true);
  assert.equal(hasMutationBoundary(guardedAction), true);
  assert.equal(hasMutationBoundary(unguardedAction), false);

  const files = [
    'app/products/[slug]/checkout-actions.ts',
    'app/admin/homepage/product-actions.ts',
    'app/example/unsafe-action.ts',
    'lib/not-app-action.ts'
  ];
  const sources: Record<string, string> = {
    'app/products/[slug]/checkout-actions.ts': guardedAction,
    'app/admin/homepage/product-actions.ts': guardedAction.replace('assertSameOriginServerAction', 'assertAdminRole'),
    'app/example/unsafe-action.ts': unguardedAction,
    'lib/not-app-action.ts': unguardedAction
  };

  const result = collectCsrfGuardFailures({
    rootDir: 'app',
    listFiles: () => files,
    readFile: (file) => sources[file]
  });

  assert.equal(result.scannedFiles, 3);
  assert.deepEqual(result.failures, [
    'app/example/unsafe-action.ts: exported server actions missing assertSameOriginServerAction, assertAdminRole, assertAdminAuthenticated, verifyApiToken, or validated webhook signature boundary'
  ]);

  console.log('server-action-csrf-gate.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runServerActionCsrfGateTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
