import { PrismaClient } from '@prisma/client';

export {
  assertDatabaseOrPreviewFallback,
  canUseSeedFallback,
  getAppRuntimeMode,
  hasDatabase,
  type AppRuntimeMode
} from '@/lib/runtime-mode';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const initialDatabaseUrl = process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: initialDatabaseUrl ? { db: { url: initialDatabaseUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
