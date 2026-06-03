import { spawn } from 'node:child_process';

const commands = [
  ['typecheck', 'npm run typecheck'],
  ['unit', 'npm run test:unit'],
  ['functional', 'npm run test:functional'],
  ['api', 'npm run test:api'],
  ['non-browser', 'npm run test:nonbrowser'],
  ['e2e-smoke-contract', 'npm run test:e2e']
];

function splitCommand(command) {
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return parts.map((part) => part.replace(/^"|"$/g, ''));
}

function runCommand(label, command) {
  return new Promise((resolve) => {
    const [cmd, ...args] = splitCommand(command);
    console.log(`\n=== ${label}: ${command} ===`);
    const child = spawn(cmd, args, {
      shell: process.platform === 'win32',
      stdio: 'inherit',
      env: process.env
    });
    child.on('exit', (code, signal) => resolve({ label, command, code: code ?? 1, signal }));
  });
}

const results = [];
for (const [label, command] of commands) {
  const result = await runCommand(label, command);
  results.push(result);
  if (result.code !== 0) break;
}

console.log('\nFull test suite summary:');
for (const result of results) {
  console.log(`${result.code === 0 ? 'PASS' : 'FAIL'} ${result.label}: ${result.command}${result.signal ? ` (${result.signal})` : ''}`);
}

const failed = results.find((result) => result.code !== 0);
if (failed) {
  process.exitCode = failed.code;
} else {
  console.log('\nAll configured tests passed.');
}
