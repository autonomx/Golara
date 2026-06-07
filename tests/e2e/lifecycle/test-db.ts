import { PrismaClient } from '@prisma/client';

export type LifecycleTestDbConfig = {
  databaseUrl: string;
  shouldRun: boolean;
  reason?: string;
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const SAFE_NAME_MARKERS = ['golara_e2e', 'golara-e2e', 'e2e', 'test'];
const BLOCKED_NAME_MARKERS = ['prod', 'production', 'live', 'staging'];

export function getLifecycleTestDbConfig(env: Record<string, string | undefined> = process.env): LifecycleTestDbConfig {
  const databaseUrl = env.E2E_DATABASE_URL?.trim() || '';
  if (!databaseUrl) {
    return {
      databaseUrl: '',
      shouldRun: false,
      reason: 'E2E_DATABASE_URL is not configured; skipping local database lifecycle E2E suite.'
    };
  }

  assertSafeLifecycleDatabaseUrl(databaseUrl);
  return { databaseUrl, shouldRun: true };
}

export function assertSafeLifecycleDatabaseUrl(databaseUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('E2E_DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('E2E_DATABASE_URL must use postgres:// or postgresql://.');
  }

  const host = parsed.hostname.toLowerCase();
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, '')).toLowerCase();
  const fullUrl = databaseUrl.toLowerCase();
  const isLocal = LOCAL_HOSTS.has(host);
  const hasSafeMarker = SAFE_NAME_MARKERS.some((marker) => databaseName.includes(marker) || fullUrl.includes(marker));
  const hasBlockedMarker = BLOCKED_NAME_MARKERS.some((marker) => databaseName.includes(marker));

  if (hasBlockedMarker) {
    throw new Error('Refusing to run lifecycle E2E against a database name that looks like production or staging.');
  }

  if (!isLocal && !hasSafeMarker) {
    throw new Error('Refusing to run lifecycle E2E unless the database is local or clearly marked as test/e2e.');
  }
}

export function createLifecyclePrismaClient(databaseUrl: string) {
  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    },
    log: ['error']
  });
}

export async function resetLifecycleDatabase(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.inventoryStockReservation.deleteMany(),
    prisma.checkoutPaymentEvent.deleteMany(),
    prisma.checkoutPaymentAttempt.deleteMany(),
    prisma.checkoutOrderTimelineEvent.deleteMany(),
    prisma.checkoutOrderItem.deleteMany(),
    prisma.checkoutOrder.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cartSession.deleteMany(),
    prisma.customerSession.deleteMany(),
    prisma.customerAccount.deleteMany(),
    prisma.customerAddress.deleteMany(),
    prisma.customerProfile.deleteMany(),
    prisma.productVariantLocationStock.deleteMany(),
    prisma.productAttributeValue.deleteMany(),
    prisma.productCollection.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.media.deleteMany(),
    prisma.product.deleteMany(),
    prisma.categoryTranslation.deleteMany(),
    prisma.category.deleteMany(),
    prisma.productType.deleteMany(),
    prisma.productAttribute.deleteMany(),
    prisma.collection.deleteMany(),
    prisma.warehouseLocation.deleteMany(),
    prisma.storefrontChannel.deleteMany()
  ]);
}
