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
