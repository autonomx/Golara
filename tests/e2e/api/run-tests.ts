import assert from 'node:assert/strict';
import { type ChildProcess } from 'node:child_process';
import {
  assertSafeLifecycleDatabaseUrl,
  createLifecyclePrismaClient,
  getLifecycleTestDbConfig
} from '@/tests/e2e/lifecycle/test-db';
import { runAccountWebhookNegativeTests } from './account-webhook-negative-tests';
import {
  runAdminRolePermissionMatrixAdvancedTests,
  runAuditLogAdvancedTests,
  runBolaObjectAuthorizationAdvancedTests,
  runImportExportJobLifecycleAdvancedTests,
  runMediaUploadBoundaryAdvancedTests,
  runPaginationFilterBoundaryAdvancedTests,
  runPaymentOperationRawTableAdvancedTests,
  runRateLimitResourceAbuseAdvancedTests,
  runRawSettingsSurfaceAdvancedTests,
  runWebhookEdgeCaseAdvancedTests
} from './admin-advanced-gap-tests';
import { runAdminAuthBoundaryTests } from './admin-auth-boundary-tests';
import { runAdminCustomerInquiryActionTests } from './admin-customer-inquiry-tests';
import { runAdminDiscountWorkspaceTests } from './admin-discount-tests';
import {
  runAdminHomepageContentActionTests,
  runAdminMediaLibraryActionTests,
  runAdminSettingsContentActionTests
} from './admin-content-tests';
import { runAdminExportBoundaryTests } from './admin-export-boundary-tests';
import { runAdminHomepageMerchandisingActionTests } from './admin-homepage-merchandising-tests';
import { runAdminSettingsLongTailActionTests } from './admin-settings-longtail-tests';
import { runAdminBoundaryPostTests } from './admin-mutation-boundary-tests';
import { runAdminProductCatalogActionTests } from './admin-catalog-tests';
import { runAdminOrderOperationsActionTests } from './admin-order-tests';
import {
  runAccountAddressBoundaryActionTests,
  runAdminCatalogTranslationEdgeTests,
  runAdminOrderNotificationContractTests,
  runAdminPaymentReadOnlyPageTests,
  runDirectProductCheckoutBoundaryTests,
  runSeedImageRouteTests
} from './admin-remaining-gap-tests';
import { runCartBoundaryTests } from './cart-boundary-tests';
import { runCartCheckoutNegativeTests } from './cart-checkout-negative-tests';
import { prepareApiFixture } from './fixture';
import { runLocaleCurrencyMatrixTests } from './locale-currency-tests';
import {
  runAccountAndAdminPageTests,
  runAdminProtectedRouteAndActionTests,
  runCartAndCheckoutPageTests,
  runCheckoutAndAddressBookActionTests,
  runCustomerAuthAndInquiryActionTests,
  runPublicReadRouteTests,
  runServerActionMutationTests
} from './storefront-account-tests';
import { startNextServer, stopNextServer } from './shared';
import { runOrderReturnRouteTests, runWebhookRouteTests } from './webhook-tests';

async function main() {
  assert.equal(getLifecycleTestDbConfig({}).shouldRun, false);
  const config = getLifecycleTestDbConfig();
  if (!config.shouldRun) {
    console.log(config.reason);
    return;
  }

  assertSafeLifecycleDatabaseUrl(config.databaseUrl, process.env.DATABASE_URL);
  const prisma = createLifecyclePrismaClient(config.databaseUrl);
  let server: ChildProcess | undefined;

  try {
    const fixture = await prepareApiFixture(prisma);
    server = await startNextServer(config.databaseUrl);

    await runPublicReadRouteTests();
    await runCartAndCheckoutPageTests(fixture);
    await runCartBoundaryTests(fixture);
    await runAccountAndAdminPageTests(fixture);
    await runServerActionMutationTests(fixture);
    await runCustomerAuthAndInquiryActionTests(fixture);
    await runCheckoutAndAddressBookActionTests(fixture);
    await runLocaleCurrencyMatrixTests(fixture);
    await runCartCheckoutNegativeTests(fixture);
    await runAccountWebhookNegativeTests(fixture);
    await runAdminAuthBoundaryTests(fixture);
    await runAdminProtectedRouteAndActionTests(fixture);
    await runAdminExportBoundaryTests(fixture);
    await runAdminBoundaryPostTests(fixture);
    await runAdminCustomerInquiryActionTests(fixture);
    await runAdminSettingsContentActionTests(fixture);
    await runAdminSettingsLongTailActionTests(fixture);
    await runAdminDiscountWorkspaceTests(fixture);
    await runAdminHomepageMerchandisingActionTests(fixture);
    await runAdminHomepageContentActionTests(fixture);
    await runAdminMediaLibraryActionTests(fixture);
    await runAdminCatalogTranslationEdgeTests(fixture);
    await runAdminProductCatalogActionTests(fixture);
    await runAccountAddressBoundaryActionTests(fixture);
    await runDirectProductCheckoutBoundaryTests(fixture);
    await runAdminOrderOperationsActionTests(fixture);
    await runAdminOrderNotificationContractTests();
    await runAdminPaymentReadOnlyPageTests(fixture);
    await runSeedImageRouteTests();
    await runOrderReturnRouteTests(fixture);
    await runWebhookRouteTests(fixture);
    await runAdminRolePermissionMatrixAdvancedTests();
    await runRawSettingsSurfaceAdvancedTests(fixture);
    await runImportExportJobLifecycleAdvancedTests(fixture);
    await runPaginationFilterBoundaryAdvancedTests(fixture);
    await runBolaObjectAuthorizationAdvancedTests(fixture);
    await runRateLimitResourceAbuseAdvancedTests(fixture);
    await runPaymentOperationRawTableAdvancedTests(fixture);
    await runWebhookEdgeCaseAdvancedTests(fixture);
    await runMediaUploadBoundaryAdvancedTests(fixture);
    await runAuditLogAdvancedTests(fixture);

    console.log('api lifecycle HTTP E2E tests passed');
  } finally {
    await stopNextServer(server);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  throw error;
});
