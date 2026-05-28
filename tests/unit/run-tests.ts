import { runRepositoryFallbackPolicyTests } from './repository-fallback-policy.test';
import { runRuntimeModeTests } from './runtime-mode.test';

await runRuntimeModeTests();
await runRepositoryFallbackPolicyTests();

console.log('unit tests passed (2 files)');
