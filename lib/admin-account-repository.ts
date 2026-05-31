import 'server-only';

import { createAdminAccountReadinessRecord, createAdminAccountReadinessSummary, type AdminAccountReadinessRecord, type AdminAccountReadinessSummary } from '@/lib/admin-account-core';
import { getAdminAuthConfig } from '@/lib/admin-auth-core';
import { readWithSeedFallback } from '@/lib/cms/repository-fallback-policy';
import { prisma } from '@/lib/prisma';

type DbAdminAccount = {
  id: string;
  provider: string;
  providerAccountId: string;
  label: string;
  email: string | null;
  role: string;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapAdminAccount(account: DbAdminAccount): AdminAccountReadinessRecord {
  return createAdminAccountReadinessRecord({
    id: account.id,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    label: account.label,
    email: account.email ?? undefined,
    role: account.role,
    isActive: account.isActive,
    metadata: account.metadata ?? undefined,
    lastLoginAt: account.lastLoginAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  });
}

function configuredAdminAccount(): AdminAccountReadinessRecord | undefined {
  const config = getAdminAuthConfig(process.env);
  if (!config.password || !config.sessionSecret) return undefined;
  return createAdminAccountReadinessRecord({
    provider: config.provider,
    providerAccountId: config.email ?? config.label,
    label: config.label,
    email: config.email,
    role: config.role,
    isActive: true,
    metadata: { source: 'environment' }
  });
}

async function readWithFallback<T>(readFromDb: () => Promise<T>, fallback: () => T): Promise<T> {
  return readWithSeedFallback(readFromDb, fallback, 'admin account repository read');
}

export async function listAdminAccountReadinessRecords(): Promise<AdminAccountReadinessRecord[]> {
  return readWithFallback(async () => {
    const accounts = await prisma.adminAccount.findMany({ orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { label: 'asc' }] });
    return accounts.map((account) => mapAdminAccount(account as DbAdminAccount));
  }, () => {
    const configured = configuredAdminAccount();
    return configured ? [configured] : [];
  });
}

export async function getAdminAccountReadinessSummary(accounts?: AdminAccountReadinessRecord[]): Promise<AdminAccountReadinessSummary> {
  const records = accounts ?? await listAdminAccountReadinessRecords();
  return createAdminAccountReadinessSummary(records);
}
