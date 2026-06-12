export function walk(dir: string): string[];
export function isServerActionSource(source: string): boolean;
export function hasExportedAsyncAction(source: string): boolean;
export function hasMutationBoundary(source: string): boolean;
export function collectCsrfGuardFailures(options?: {
  rootDir?: string;
  readFile?: (path: string, encoding: BufferEncoding) => string;
  listFiles?: (dir: string) => string[];
}): { scannedFiles: number; failures: string[] };
export function runCsrfGuardCheck(): void;
