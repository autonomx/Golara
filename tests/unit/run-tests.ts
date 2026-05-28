import { runCustomerAuthIdentityTests } from './customer-auth-identity.test';
import { runRepositoryFallbackPolicyTests } from './repository-fallback-policy.test';
import { runRuntimeModeTests } from './runtime-mode.test';
import { runRuntimeReadinessTests } from './runtime-readiness.test';

async function main() {
  await runRuntimeModeTests();
  await runRepositoryFallbackPolicyTests();
  await runRuntimeReadinessTests();
  await runCustomerAuthIdentityTests();
  console.log('unit tests passed (4 files)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
