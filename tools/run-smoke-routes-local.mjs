import { spawn } from 'node:child_process';

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const baseUrl = (process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const readyTimeoutMs = Number.parseInt(process.env.SMOKE_READY_TIMEOUT_MS || '30000', 10);
const pollIntervalMs = Number.parseInt(process.env.SMOKE_READY_POLL_MS || '500', 10);
const startCommand = process.env.SMOKE_START_COMMAND || 'npm run start';

function splitCommand(command) {
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return parts.map((part) => part.replace(/^"|"$/g, ''));
}

function spawnCommand(command, options = {}) {
  const [cmd, ...args] = splitCommand(command);
  if (!cmd) throw new Error(`Missing command: ${command}`);
  return spawn(cmd, args, {
    shell: process.platform === 'win32',
    stdio: options.stdio || 'inherit',
    env: {
      ...process.env,
      ...options.env
    }
  });
}

async function waitForReady() {
  const deadline = Date.now() + readyTimeoutMs;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) {
        return;
      }
      lastError = `status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timed out waiting for ${baseUrl} (${lastError})`);
}

function waitForProcess(child) {
  return new Promise((resolve) => {
    child.on('exit', (code, signal) => resolve({ code, signal }));
  });
}

async function runSmokeRoutes() {
  const child = spawnCommand('npm run smoke:routes', {
    env: {
      SMOKE_BASE_URL: baseUrl
    }
  });
  const result = await waitForProcess(child);
  return result.code ?? 1;
}

let server;
try {
  console.log(`Starting app with: ${startCommand}`);
  server = spawnCommand(startCommand);
  await waitForReady();
  console.log(`App is ready at ${baseUrl}`);
  const exitCode = await runSmokeRoutes();
  process.exitCode = exitCode;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (server && !server.killed) {
    server.kill();
  }
}
