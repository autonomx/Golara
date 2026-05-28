const tests = [
  './runtime-mode.test.ts',
  './repository-fallback-policy.test.ts'
];

for (const test of tests) {
  await import(test);
}

console.log(`unit tests passed (${tests.length} files)`);
