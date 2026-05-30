import { runCheckoutCapacityHoldTests } from './checkout-capacity-hold.test';
import { runCheckoutStateMachineTests } from './checkout-state-machine.test';
import { runCustomerAuthIdentityTests } from './customer-auth-identity.test';
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
  await runCustomerAuthIdentityTests();
  await runOtpRateLimitTests();
  await runCheckoutStateMachineTests();
  await runCheckoutCapacityHoldTests();
  await runI18nLocalizationTests();
  console.log('unit tests passed (9 files)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
