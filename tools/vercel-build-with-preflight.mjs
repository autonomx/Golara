#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options
  });

  if (result.error) {
    console.error(`[vercel-build] failed to run ${command}:`, result.error);
    process.exit(1);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.signal) {
    console.error(`[vercel-build] ${command} exited with signal ${result.signal}`);
    process.exit(1);
  }
}

const appMode = process.env.APP_MODE?.trim().toLowerCase() || '';
const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase() || '';
const productionDeploy = appMode === 'production' || vercelEnv === 'production';

if (productionDeploy) {
  console.log('[vercel-build] production deploy detected; running deploy readiness guard');
  run('npm', ['run', 'check:deploy-readiness']);
} else {
  console.log('[vercel-build] non-production deploy detected; skipping deploy readiness guard');
}

run('npm', ['run', 'build']);
