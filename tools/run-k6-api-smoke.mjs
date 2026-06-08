import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const required = process.env.K6_REQUIRED === 'true';
const script = 'tests/K6LoadTest/src/test/golaraApiSmokeTest.js';
const baseUrl = process.env.K6_BASE_URL || 'http://127.0.0.1:3100';

if (!existsSync(script)) {
  console.error(`${script} is missing.`);
  process.exit(1);
}

const version = spawnSync('k6', ['version'], {
  cwd: process.cwd(),
  shell: process.platform === 'win32',
  stdio: 'ignore'
});

if (version.status !== 0) {
  if (!required) {
    console.log('k6 API load smoke skipped. Install k6 and set K6_REQUIRED=true to make this mandatory.');
    process.exit(0);
  }
  console.error('k6 is required but was not found.');
  process.exit(version.status ?? 1);
}

try {
  const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1500) });
  if (response.status >= 500) throw new Error(`status ${response.status}`);
} catch (error) {
  if (!required) {
    console.log(`k6 API load smoke skipped. ${baseUrl} is not reachable; start the app or set K6_BASE_URL to a running target.`);
    process.exit(0);
  }
  console.error(`k6 target ${baseUrl} is not reachable: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const result = spawnSync('k6', ['run', script], {
  cwd: process.cwd(),
  shell: process.platform === 'win32',
  stdio: 'inherit',
  env: {
    K6_BASE_URL: baseUrl,
    ...process.env
  }
});

if (result.status === 0) process.exit(0);

process.exit(result.status ?? 1);
