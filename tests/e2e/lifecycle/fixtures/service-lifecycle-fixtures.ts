import type { PrismaClient } from '@prisma/client';
import { runServiceAuthStockFlow } from './service-auth-stock-flow';
import { runServiceCancellationRefundAdminFlow } from './service-cancellation-admin-flow';
import { runServiceCatalogCartFlow } from './service-catalog-cart-flow';
import { withServiceLifecycleEnvironment, type ServiceLifecycleState } from './service-lifecycle-context';
import { runServicePrimaryOrderFlow } from './service-primary-order-flow';
import { runServiceWebhookFlow } from './service-webhook-flow';

export async function runLifecycleServiceRepositoryScenario(prisma: PrismaClient, databaseUrl: string) {
  await withServiceLifecycleEnvironment(databaseUrl, async (modules) => {
    const state: ServiceLifecycleState = { prisma, databaseUrl, modules };
    await runServiceCatalogCartFlow(state);
    await runServicePrimaryOrderFlow(state);
    await runServiceAuthStockFlow(state);
    await runServiceCancellationRefundAdminFlow(state);
    await runServiceWebhookFlow(state);
  });
}
