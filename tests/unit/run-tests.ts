import { runCustomerAuthIdentityTests } from './customer-auth-identity.test';
import { runOtpRateLimitTests } from './otp-rate-limit.test';
import { runRepositoryFallbackPolicyTests } from './repository-fallback-policy.test';
import { runRuntimeModeTests } from './runtime-mode.test';
import { runRuntimeReadinessTests } from './runtime-readiness.test';

async function main() {
  await runRuntimeModeTests();
  await runRepositoryFallbackPolicyTests();
  await runRuntimeReadinessTests();
  await runCustomerAuthIdentityTests();
  await runOtpRateLimitTests();
  console.log('unit tests passed (5 files)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
