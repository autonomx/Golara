import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

import type { SiteAnalyticsRetentionCleanupDelegate } from './site-analytics-retention-cleanup-executor';

export const SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED_ENV = 'SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED';
export const SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_MAX_BATCH_SIZE = 1000;

function flagEnabled(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

export type SiteAnalyticsRetentionCleanupDelegateState = {
  enabled: boolean;
  databaseConfigured: boolean;
  attached: boolean;
  maxBatchSize: number;
  blockers: string[];
};

export type SiteAnalyticsRetentionCleanupDelegateAttachment = {
  delegate: SiteAnalyticsRetentionCleanupDelegate | null;
  state: SiteAnalyticsRetentionCleanupDelegateState;
};

export function buildSiteAnalyticsRetentionCleanupDelegate(options: {
  env?: NodeJS.ProcessEnv;
  databaseConfigured?: boolean;
} = {}): SiteAnalyticsRetentionCleanupDelegateAttachment {
  const env = options.env ?? process.env;
  const enabled = flagEnabled(env, SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED_ENV);
  const databaseConfigured = options.databaseConfigured ?? hasDatabase();
  const blockers: string[] = [];

  if (!enabled) blockers.push('retention cleanup delegate flag is disabled');
  if (!databaseConfigured) blockers.push('database is not configured for retention cleanup delegate');

  if (blockers.length > 0) {
    return {
      delegate: null,
      state: {
        enabled,
        databaseConfigured,
        attached: false,
        maxBatchSize: SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_MAX_BATCH_SIZE,
        blockers
      }
    };
  }

  return {
    delegate: {
      async deleteMany(args) {
        const requestedTake = args.take ?? 0;
        const take = Math.min(
          SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_MAX_BATCH_SIZE,
          Math.max(0, Math.trunc(requestedTake))
        );
        if (take <= 0) return { count: 0 };

        const count = await prisma.$executeRaw`
          DELETE FROM "SiteAnalyticsEvent"
          WHERE "id" IN (
            SELECT "id"
            FROM "SiteAnalyticsEvent"
            WHERE "createdAt" < ${args.where.createdAt.lt}
            ORDER BY "createdAt" ASC
            LIMIT ${take}
          )
        `;

        return { count: typeof count === 'number' ? count : Number(count) || 0 };
      }
    },
    state: {
      enabled,
      databaseConfigured,
      attached: true,
      maxBatchSize: SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_MAX_BATCH_SIZE,
      blockers: []
    }
  };
}
