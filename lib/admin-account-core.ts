import { normalizeAdminIdentityProvider, normalizeAdminRole, type AdminIdentityProvider, type AdminRole } from './admin-auth-core';

export type AdminAccountInput = {
  provider?: string;
  providerAccountId: string;
  label: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
};

export type AdminAccountRecord = {
  provider: AdminIdentityProvider;
  providerAccountId: string;
  label: string;
  email?: string;
  role: AdminRole;
  isActive: boolean;
  metadata?: Record<string, unknown>;
};

export type AdminAccountReadinessRecord = AdminAccountRecord & {
  id?: string;
  assignmentKey: string;
  accessStatus: 'active' | 'inactive';
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AdminAccountReadinessSummary = {
  total: number;
  active: number;
  inactive: number;
  owners: number;
  staff: number;
  missingEmail: number;
  assignable: number;
  assignmentStable: boolean;
  rotationRunbook: string[];
};

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function normalizeAdminAccountInput(input: AdminAccountInput): AdminAccountRecord {
  const providerAccountId = input.providerAccountId.trim();
  const label = input.label.trim();

  if (!providerAccountId) {
    throw new Error('Admin account providerAccountId is required.');
  }

  if (!label) {
    throw new Error('Admin account label is required.');
  }

  return {
    provider: normalizeAdminIdentityProvider(input.provider),
    providerAccountId,
    label,
    email: normalizeOptionalString(input.email),
    role: normalizeAdminRole(input.role),
    isActive: input.isActive ?? true,
    metadata: input.metadata
  };
}

export function getAdminAccountAssignmentKey(account: AdminAccountRecord) {
  return account.email || account.providerAccountId || account.label;
}

export function createAdminAccountReadinessRecord(input: AdminAccountInput & { id?: string; lastLoginAt?: Date | null; createdAt?: Date; updatedAt?: Date }): AdminAccountReadinessRecord {
  const normalized = normalizeAdminAccountInput(input);
  return {
    ...normalized,
    id: input.id,
    assignmentKey: getAdminAccountAssignmentKey(normalized),
    accessStatus: normalized.isActive ? 'active' : 'inactive',
    lastLoginAt: input.lastLoginAt ?? undefined,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

export function createAdminAccountReadinessSummary(accounts: AdminAccountReadinessRecord[]): AdminAccountReadinessSummary {
  const activeAccounts = accounts.filter((account) => account.isActive);
  const activeAssignableAccounts = activeAccounts.filter((account) => Boolean(account.assignmentKey));

  return {
    total: accounts.length,
    active: activeAccounts.length,
    inactive: accounts.filter((account) => !account.isActive).length,
    owners: activeAccounts.filter((account) => account.role === 'owner').length,
    staff: activeAccounts.filter((account) => account.role === 'staff').length,
    missingEmail: activeAccounts.filter((account) => !account.email).length,
    assignable: activeAssignableAccounts.length,
    assignmentStable: activeAssignableAccounts.length === activeAccounts.length,
    rotationRunbook: [
      'Create or rotate staff access through the configured admin identity provider and keep providerAccountId stable.',
      'Set email whenever possible so inquiry assignment can match staff identities across sessions and reports.',
      'Deactivate access by setting isActive=false or removing the credential from the provider, then verify the account is no longer active before launch.',
      'Keep at least one active owner account available before disabling or rotating any owner credential.'
    ]
  };
}
