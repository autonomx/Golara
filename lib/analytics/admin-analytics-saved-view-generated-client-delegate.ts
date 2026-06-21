import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

import {
  buildAdminAnalyticsSavedViewStorageDelegate,
  type AdminAnalyticsSavedViewStorageDelegateAttachment,
  type AdminAnalyticsSavedViewStorageDelegateState
} from './admin-analytics-saved-view-storage-delegate';
import type {
  AdminAnalyticsSavedViewStorageData,
  AdminAnalyticsSavedViewStorageDelegate,
  AdminAnalyticsSavedViewStoredRow,
  AdminAnalyticsSavedViewWhereUnique
} from './admin-analytics-saved-view-storage-apply';

export const ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_DELEGATE_ENABLED_ENV =
  'ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_DELEGATE_ENABLED';

export type AdminAnalyticsSavedViewGeneratedClientDelegate = {
  upsert: (args: {
    where: AdminAnalyticsSavedViewWhereUnique;
    create: AdminAnalyticsSavedViewStorageData;
    update: Partial<AdminAnalyticsSavedViewStorageData>;
  }) => Promise<AdminAnalyticsSavedViewStoredRow>;
  update: (args: {
    where: AdminAnalyticsSavedViewWhereUnique;
    data: Partial<AdminAnalyticsSavedViewStorageData>;
  }) => Promise<AdminAnalyticsSavedViewStoredRow>;
};

export type AdminAnalyticsSavedViewPreferredStorageDelegateState = AdminAnalyticsSavedViewStorageDelegateState & {
  source: 'generated-client' | 'raw-sql' | 'none';
  generatedClientEnabled: boolean;
  generatedClientAvailable: boolean;
};

export type AdminAnalyticsSavedViewPreferredStorageDelegateAttachment = {
  delegate: AdminAnalyticsSavedViewStorageDelegate | null;
  state: AdminAnalyticsSavedViewPreferredStorageDelegateState;
};

type UnknownPrismaSavedViewClient = {
  adminAnalyticsSavedView?: AdminAnalyticsSavedViewGeneratedClientDelegate | null;
};

function flagEnabled(env: Record<string, string | undefined>, name: string) {
  const value = env[name]?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function generatedClientFromPrisma(prismaClient: unknown): AdminAnalyticsSavedViewGeneratedClientDelegate | null {
  const candidate = (prismaClient as UnknownPrismaSavedViewClient).adminAnalyticsSavedView ?? null;
  if (!candidate) return null;
  if (typeof candidate.upsert !== 'function') return null;
  if (typeof candidate.update !== 'function') return null;
  return candidate;
}

export function buildAdminAnalyticsSavedViewGeneratedClientDelegate(options: {
  env?: Record<string, string | undefined>;
  databaseConfigured?: boolean;
  generatedClient?: AdminAnalyticsSavedViewGeneratedClientDelegate | null;
  prismaClient?: unknown;
} = {}): AdminAnalyticsSavedViewPreferredStorageDelegateAttachment {
  const env = options.env ?? process.env;
  const enabled = flagEnabled(env, ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_DELEGATE_ENABLED_ENV);
  const databaseConfigured = options.databaseConfigured ?? hasDatabase();
  const generatedClient = options.generatedClient ?? generatedClientFromPrisma(options.prismaClient ?? prisma);
  const blockers: string[] = [];

  if (!enabled) blockers.push('saved-view generated-client delegate flag is disabled');
  if (!databaseConfigured) blockers.push('database is not configured for saved-view generated-client delegate');
  if (generatedClient === null) blockers.push('generated saved-view Prisma delegate is not available');

  if (blockers.length > 0 || generatedClient === null) {
    return {
      delegate: null,
      state: {
        enabled,
        databaseConfigured,
        attached: false,
        metadataOnly: true,
        source: 'none',
        generatedClientEnabled: enabled,
        generatedClientAvailable: generatedClient !== null,
        blockers
      }
    };
  }

  return {
    delegate: generatedClient,
    state: {
      enabled,
      databaseConfigured,
      attached: true,
      metadataOnly: true,
      source: 'generated-client',
      generatedClientEnabled: true,
      generatedClientAvailable: true,
      blockers: []
    }
  };
}

export function buildAdminAnalyticsSavedViewPreferredStorageDelegate(options: {
  env?: Record<string, string | undefined>;
  databaseConfigured?: boolean;
  generatedClient?: AdminAnalyticsSavedViewGeneratedClientDelegate | null;
  prismaClient?: unknown;
  fallback?: AdminAnalyticsSavedViewStorageDelegateAttachment;
} = {}): AdminAnalyticsSavedViewPreferredStorageDelegateAttachment {
  const generated = buildAdminAnalyticsSavedViewGeneratedClientDelegate(options);
  if (generated.delegate !== null) return generated;

  const fallback = options.fallback ?? buildAdminAnalyticsSavedViewStorageDelegate({
    env: options.env,
    databaseConfigured: options.databaseConfigured
  });
  if (fallback.delegate === null) {
    return {
      delegate: null,
      state: {
        ...fallback.state,
        source: 'none',
        generatedClientEnabled: generated.state.generatedClientEnabled,
        generatedClientAvailable: generated.state.generatedClientAvailable,
        blockers: [...generated.state.blockers, ...fallback.state.blockers]
      }
    };
  }

  return {
    delegate: fallback.delegate,
    state: {
      ...fallback.state,
      source: 'raw-sql',
      generatedClientEnabled: generated.state.generatedClientEnabled,
      generatedClientAvailable: generated.state.generatedClientAvailable,
      blockers: generated.state.generatedClientEnabled ? generated.state.blockers : []
    }
  };
}
