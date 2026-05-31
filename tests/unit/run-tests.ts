import { runAdminActionBoundaryGuardTests } from './admin-action-boundary-guard.test';
import { runCheckoutCapacityHoldTests } from './checkout-capacity-hold.test';
import { runCheckoutStateMachineTests } from './checkout-state-machine.test';
import { runCmsCategoryServiceTests } from './cms-category-service.test';
import { runCmsHomepageServiceTests } from './cms-homepage-service.test';
import { runCmsInquiryServiceTests } from './cms-inquiry-service.test';
import { runCmsMediaServiceTests } from './cms-media-service.test';
import { runCmsProductServiceTests } from './cms-product-service.test';
import { runCmsServiceTypesTests } from './cms-service-types.test';
import { runCustomerAuthIdentityTests } from './customer-auth-identity.test';
import { runDeployReadinessTests } from './deploy-readiness.test';
import { runI18nLocalizationTests } from './i18n-localization.test';
import { runMediaStorageReadinessTests } from './media-storage-readiness.test';
import { runOtpRateLimitTests } from './otp-rate-limit.test';
import { runRepositoryFallbackPolicyTests } from './repository-fallback-policy.test';
import { runRuntimeModeTests } from './runtime-mode.test';
import { runRuntimeReadinessTests } from './runtime-readiness.test';

async function main() {
  await runRuntimeModeTests();
  await runRepositoryFallbackPolicyTests();
  await runRuntimeReadinessTests();
  await runMediaStorageReadinessTests();
  await runDeployReadinessTests();
  await runAdminActionBoundaryGuardTests();
  await runCmsServiceTypesTests();
  await runCmsMediaServiceTests();
  await runCmsCategoryServiceTests();
  await runCmsProductServiceTests();
  await runCmsHomepageServiceTests();
  await runCmsInquiryServiceTests();
  await runCustomerAuthIdentityTests();
  await runOtpRateLimitTests();
  await runCheckoutStateMachineTests();
  await runCheckoutCapacityHoldTests();
  await runI18nLocalizationTests();
  console.log('unit tests passed (17 files)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
