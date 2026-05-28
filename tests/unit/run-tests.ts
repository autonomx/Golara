import { runRepositoryFallbackPolicyTests } from './repository-fallback-policy.test';
import { runRuntimeModeTests } from './runtime-mode.test';

async function main() {
  await runRuntimeModeTests();
  await runRepositoryFallbackPolicyTests();
  console.log('unit tests passed (2 files)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
