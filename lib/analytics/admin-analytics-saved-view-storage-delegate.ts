import 'server-only';

import { randomUUID } from 'node:crypto';

import { hasDatabase, prisma } from '@/lib/prisma';

import type {
  AdminAnalyticsSavedViewStorageData,
  AdminAnalyticsSavedViewStorageDelegate,
  AdminAnalyticsSavedViewStoredRow,
  AdminAnalyticsSavedViewWhereUnique
} from './admin-analytics-saved-view-storage-apply';

export const ADMIN_ANALYTICS_SAVED_VIEW_STORAGE_DELEGATE_ENABLED_ENV = 'ADMIN_ANALYTICS_SAVED_VIEW_STORAGE_DELEGATE_ENABLED';

function flagEnabled(env: Record<string, string | undefined>, name: string) {
  const value = env[name]?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

export type AdminAnalyticsSavedViewStorageDelegateState = {
  enabled: boolean;
  databaseConfigured: boolean;
  attached: boolean;
  metadataOnly: true;
  blockers: string[];
};

export type AdminAnalyticsSavedViewStorageDelegateAttachment = {
  delegate: AdminAnalyticsSavedViewStorageDelegate | null;
  state: AdminAnalyticsSavedViewStorageDelegateState;
};

function scopeWhere(where: AdminAnalyticsSavedViewWhereUnique) {
  return where.viewKey_scope;
}

function serializeSectionAnchors(data: Pick<AdminAnalyticsSavedViewStorageData, 'sectionAnchors'>) {
  return JSON.stringify(data.sectionAnchors);
}

function serializeMetadata(data: Pick<AdminAnalyticsSavedViewStorageData, 'metadata'>) {
  return JSON.stringify(data.metadata);
}

async function upsertSavedView(args: {
  where: AdminAnalyticsSavedViewWhereUnique;
  create: AdminAnalyticsSavedViewStorageData;
  update: Partial<AdminAnalyticsSavedViewStorageData>;
}): Promise<AdminAnalyticsSavedViewStoredRow> {
  const where = scopeWhere(args.where);
  const create = args.create;
  const update = args.update;
  const sectionAnchors = serializeSectionAnchors(create);
  const metadata = serializeMetadata(create);
  const updateSectionAnchors = JSON.stringify(update.sectionAnchors ?? create.sectionAnchors);
  const updateMetadata = JSON.stringify(update.metadata ?? create.metadata);

  const rows = await prisma.$queryRaw<AdminAnalyticsSavedViewStoredRow[]>`
    INSERT INTO "AdminAnalyticsSavedView" (
      "id", "viewKey", "label", "description", "scope", "audience", "rangeMode", "rangeQuery",
      "sectionAnchors", "ownerApproved", "isActive", "createdByRole", "createdByLabel", "metadata"
    ) VALUES (
      ${randomUUID()}, ${create.viewKey}, ${create.label}, ${create.description}, ${create.scope}, ${create.audience},
      ${create.rangeMode}, ${create.rangeQuery}, CAST(${sectionAnchors} AS JSONB), ${create.ownerApproved}, ${create.isActive},
      ${create.createdByRole}, ${create.createdByLabel}, CAST(${metadata} AS JSONB)
    )
    ON CONFLICT ("viewKey", "scope") DO UPDATE SET
      "label" = ${update.label ?? create.label},
      "description" = ${update.description ?? create.description},
      "audience" = ${update.audience ?? create.audience},
      "rangeMode" = ${update.rangeMode ?? create.rangeMode},
      "rangeQuery" = ${update.rangeQuery ?? create.rangeQuery},
      "sectionAnchors" = CAST(${updateSectionAnchors} AS JSONB),
      "ownerApproved" = ${update.ownerApproved ?? create.ownerApproved},
      "isActive" = ${update.isActive ?? create.isActive},
      "metadata" = CAST(${updateMetadata} AS JSONB),
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "AdminAnalyticsSavedView"."viewKey" = ${where.viewKey}
      AND "AdminAnalyticsSavedView"."scope" = ${where.scope}
    RETURNING *
  `;
  return rows[0] ?? create;
}

async function updateSavedView(args: {
  where: AdminAnalyticsSavedViewWhereUnique;
  data: Partial<AdminAnalyticsSavedViewStorageData>;
}): Promise<AdminAnalyticsSavedViewStoredRow> {
  const where = scopeWhere(args.where);
  const data = args.data;
  const metadata = data.metadata ? JSON.stringify(data.metadata) : undefined;

  const rows = await prisma.$queryRaw<AdminAnalyticsSavedViewStoredRow[]>`
    UPDATE "AdminAnalyticsSavedView"
    SET
      "ownerApproved" = COALESCE(${data.ownerApproved ?? null}, "ownerApproved"),
      "isActive" = COALESCE(${data.isActive ?? null}, "isActive"),
      "metadata" = COALESCE(CAST(${metadata ?? null} AS JSONB), "metadata"),
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "viewKey" = ${where.viewKey}
      AND "scope" = ${where.scope}
    RETURNING *
  `;
  return rows[0] ?? {
    viewKey: where.viewKey,
    label: where.viewKey,
    description: null,
    scope: where.scope,
    audience: 'owner',
    rangeMode: 'preset',
    rangeQuery: '',
    sectionAnchors: [],
    ownerApproved: data.ownerApproved ?? false,
    isActive: data.isActive ?? false,
    createdByRole: 'owner',
    createdByLabel: null,
    metadata: data.metadata ?? {}
  };
}

export function buildAdminAnalyticsSavedViewStorageDelegate(options: {
  env?: Record<string, string | undefined>;
  databaseConfigured?: boolean;
} = {}): AdminAnalyticsSavedViewStorageDelegateAttachment {
  const env = options.env ?? process.env;
  const enabled = flagEnabled(env, ADMIN_ANALYTICS_SAVED_VIEW_STORAGE_DELEGATE_ENABLED_ENV);
  const databaseConfigured = options.databaseConfigured ?? hasDatabase();
  const blockers: string[] = [];

  if (!enabled) blockers.push('saved-view storage delegate flag is disabled');
  if (!databaseConfigured) blockers.push('database is not configured for saved-view storage delegate');

  if (blockers.length > 0) {
    return {
      delegate: null,
      state: {
        enabled,
        databaseConfigured,
        attached: false,
        metadataOnly: true,
        blockers
      }
    };
  }

  return {
    delegate: {
      upsert: upsertSavedView,
      update: updateSavedView
    },
    state: {
      enabled,
      databaseConfigured,
      attached: true,
      metadataOnly: true,
      blockers: []
    }
  };
}
