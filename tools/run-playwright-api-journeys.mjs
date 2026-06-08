import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const required = process.env.PLAYWRIGHT_REQUIRED === 'true';
const spec = 'tests/browser/api-journeys.spec.mjs';

if (!existsSync(spec)) {
  console.error(`${spec} is missing.`);
  process.exit(1);
}

const result = spawnSync('npx', ['playwright', 'test', spec], {
  cwd: process.cwd(),
  shell: process.platform === 'win32',
  stdio: 'inherit',
  env: process.env
});

if (result.status === 0) process.exit(0);

if (!required) {
  console.log('Playwright browser journey tests skipped. Set PLAYWRIGHT_REQUIRED=true after installing Playwright browsers to make this mandatory.');
  process.exit(0);
}

process.exit(result.status ?? 1);
