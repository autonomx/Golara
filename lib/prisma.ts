import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export type AppRuntimeMode = 'preview' | 'development' | 'test' | 'production';

export function getAppRuntimeMode(): AppRuntimeMode {
  const configuredMode = process.env.APP_MODE?.trim().toLowerCase();
  if (configuredMode === 'production') return 'production';
  if (configuredMode === 'test') return 'test';
  if (configuredMode === 'development') return 'development';
  if (configuredMode === 'preview') return 'preview';

  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'development') return 'development';

  return 'preview';
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function canUseSeedFallback() {
  return getAppRuntimeMode() !== 'production';
}

export function assertDatabaseOrPreviewFallback(context: string) {
  if (hasDatabase() || canUseSeedFallback()) return;

  throw new Error(
    `${context}: DATABASE_URL is required when APP_MODE=production or VERCEL_ENV=production. ` +
      'Set APP_MODE=preview for seeded preview builds, or configure DATABASE_URL for production.'
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
