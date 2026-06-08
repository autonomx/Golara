import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export function source(filePath: string) {
  return readFileSync(filePath, 'utf8');
}

export function walkFiles(root: string, predicate: (filePath: string) => boolean) {
  const results: string[] = [];
  for (const entry of readdirSync(root)) {
    const absolute = path.join(root, entry);
    const relative = absolute.replaceAll('\\', '/');
    if (statSync(absolute).isDirectory()) {
      results.push(...walkFiles(absolute, predicate));
    } else if (predicate(relative)) {
      results.push(relative);
    }
  }
  return results.sort();
}

export function appPath(filePath: string) {
  return filePath.slice(filePath.indexOf('app/'));
}
