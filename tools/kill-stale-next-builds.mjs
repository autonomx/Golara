import { execFileSync } from 'node:child_process';

if (process.platform !== 'win32') {
  process.exit(0);
}

const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
Get-CimInstance Win32_Process |
  Select-Object ProcessId,ParentProcessId,Name,CommandLine |
  ConvertTo-Json -Compress
`;

function listProcesses() {
  try {
    const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', psScript], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();

    if (!output) {
      return [];
    }

    const processes = JSON.parse(output);
    return Array.isArray(processes) ? processes : [processes];
  } catch (error) {
    console.warn('[prebuild] Could not inspect running Node processes; continuing build.');
    return [];
  }
}

function isBuildProcess(commandLine = '') {
  const normalized = commandLine.toLowerCase();

  return (
    /next[\\/]+dist[\\/]+bin[\\/]+next"?\s+build\b/.test(normalized) ||
    /npm-cli\.js"?\s+run\s+build\b/.test(normalized) ||
    /npx-cli\.js"?\s+next\s+build\b/.test(normalized)
  );
}

function isDevProcess(commandLine = '') {
  const normalized = commandLine.toLowerCase();

  return (
    /next[\\/]+dist[\\/]+bin[\\/]+next"?\s+dev\b/.test(normalized) ||
    /next[\\/]+dist[\\/]+server[\\/]+lib[\\/]+start-server\.js\b/.test(normalized)
  );
}

function isSameRepoProcess(commandLine = '') {
  const normalizedCommand = commandLine.toLowerCase().replaceAll('\\', '/');
  const normalizedCwd = process.cwd().toLowerCase().replaceAll('\\', '/');

  return normalizedCommand.includes(normalizedCwd);
}

const processes = listProcesses();
const byPid = new Map(processes.map((entry) => [Number(entry.ProcessId), entry]));
const currentTree = new Set();

for (let pid = process.pid; pid && byPid.has(pid); ) {
  currentTree.add(pid);
  pid = Number(byPid.get(pid)?.ParentProcessId);
}

const staleBuilds = processes
  .map((entry) => ({
    pid: Number(entry.ProcessId),
    parentPid: Number(entry.ParentProcessId),
    name: String(entry.Name ?? ''),
    commandLine: String(entry.CommandLine ?? '')
  }))
  .filter((entry) => {
    const isNodeProcess = /^(node|npm)/i.test(entry.name);
    const parentIsGone = entry.parentPid > 0 && !byPid.has(entry.parentPid);

    return (
      isNodeProcess &&
      parentIsGone &&
      entry.pid &&
      !currentTree.has(entry.pid) &&
      isBuildProcess(entry.commandLine)
    );
  });

const blockingDevServers = processes
  .map((entry) => ({
    pid: Number(entry.ProcessId),
    name: String(entry.Name ?? ''),
    commandLine: String(entry.CommandLine ?? '')
  }))
  .filter((entry) => {
    const isNodeProcess = /^(node|npm)/i.test(entry.name);

    return (
      isNodeProcess &&
      entry.pid &&
      !currentTree.has(entry.pid) &&
      isSameRepoProcess(entry.commandLine) &&
      isDevProcess(entry.commandLine)
    );
  });

for (const staleBuild of staleBuilds) {
  try {
    process.kill(staleBuild.pid, 'SIGTERM');
    console.log(`[prebuild] Stopped stale Next build process ${staleBuild.pid}.`);
  } catch (error) {
    console.warn(`[prebuild] Could not stop stale Next build process ${staleBuild.pid}; continuing.`);
  }
}

for (const devServer of blockingDevServers) {
  try {
    process.kill(devServer.pid, 'SIGTERM');
    console.log(`[prebuild] Stopped local Next dev process ${devServer.pid} before build.`);
  } catch (error) {
    console.warn(`[prebuild] Could not stop local Next dev process ${devServer.pid}; build may hang.`);
  }
}
