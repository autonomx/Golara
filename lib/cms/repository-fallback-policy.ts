import { assertDatabaseOrPreviewFallback, canUseSeedFallback, hasDatabase } from '../runtime-mode';

export async function readWithSeedFallback<T>(
  readFromDb: () => Promise<T>,
  fallback: () => T,
  context: string
): Promise<T> {
  assertDatabaseOrPreviewFallback(context);

  if (!hasDatabase()) return fallback();

  try {
    return await readFromDb();
  } catch (error) {
    if (!canUseSeedFallback()) throw error;
    console.warn(`[cms] ${context} failed; using seeded fallback content`, error);
    return fallback();
  }
}
