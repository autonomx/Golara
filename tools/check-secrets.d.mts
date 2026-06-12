export type SecretPattern = {
  name: string;
  pattern: RegExp;
};

export type SecretFinding = {
  filePath: string;
  line: number;
  pattern: string;
};

export const SECRET_PATTERNS: SecretPattern[];
export function shouldScanPath(path: string): boolean;
export function scanContent(content: string, filePath?: string): SecretFinding[];
export function scanRepository(root?: string): SecretFinding[];
