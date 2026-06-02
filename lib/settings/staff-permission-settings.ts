import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import {
  createAdminAccountReadinessRecord,
  createAdminAccountReadinessSummary,
  normalizeAdminAccountInput,
  type AdminAccountReadinessRecord,
  type AdminAccountReadinessSummary
} from '@/lib/admin-account-core';
import { normalizeAdminRole, type AdminRole } from '@/lib/admin-auth-core';
import { hasDatabase, prisma } from '@/lib/prisma';

export const STAFF_PERMISSION_KEYS = [
  'inquiries:read',
  'inquiries:write',
  'orders:read',
  'orders:write',
  'customers:read',
  'customers:write',
  'catalog:read',
  'catalog:write',
  'fulfillment:write',
  'settings:read',
  'settings:write'
] as const;

export type StaffPermissionKey = (typeof STAFF_PERMISSION_KEYS)[number];

export type AdminPermissionGroup = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  role: AdminRole;
  permissions: StaffPermissionKey[];
  isDefault: boolean;
  isActive: boolean;
  updatedAt?: Date;
};

export type AdminPermissionGroupInput = {
  key: string;
  label: string;
  description?: string | null;
  role: string;
  permissions: string[];
  isDefault: boolean;
  isActive: boolean;
};

export type AdminStaffAccount = AdminAccountReadinessRecord & {
  permissionGroupKey?: string | null;
};

export type AdminStaffAccountInput = {
  provider?: string;
  providerAccountId: string;
  label: string;
  email?: string | null;
  role?: string;
  permissionGroupKey?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
};

export type StaffPermissionSettingsSnapshot = {
  groups: AdminPermissionGroup[];
  accounts: AdminStaffAccount[];
  summary: AdminAccountReadinessSummary;
};

export const DEFAULT_STAFF_PERMISSION_GROUP: AdminPermissionGroup = {
  id: 'staff-permission-group-operations',
  key: 'staff-operations',
  label: 'Staff operations',
  description: 'Default staff permission group for inquiry, order, customer, and fulfillment operations.',
  role: 'staff',
  permissions: ['inquiries:read', 'inquiries:write', 'orders:read', 'orders:write', 'customers:read', 'fulfillment:write'],
  isDefault: true,
  isActive: true
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeSlug(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || DEFAULT_STAFF_PERMISSION_GROUP.key;
}

export function normalizeStaffPermissionKey(value: string): StaffPermissionKey | null {
  const normalized = value.trim().toLowerCase();
  return STAFF_PERMISSION_KEYS.includes(normalized as StaffPermissionKey) ? normalized as StaffPermissionKey : null;
}

export function normalizeStaffPermissionList(values: string[] | string): StaffPermissionKey[] {
  const rawValues = Array.isArray(values) ? values : values.split(/[\n,]+/g);
  return Array.from(new Set(rawValues.map(normalizeStaffPermissionKey).filter(Boolean) as StaffPermissionKey[])).sort();
}

export function normalizeAdminPermissionGroupInput(input: AdminPermissionGroupInput): AdminPermissionGroupInput {
  const permissions = normalizeStaffPermissionList(input.permissions);
  return {
    key: normalizeSlug(input.key),
    label: optionalText(input.label) ?? DEFAULT_STAFF_PERMISSION_GROUP.label,
    description: optionalText(input.description),
    role: normalizeAdminRole(input.role),
    permissions: permissions.length ? permissions : DEFAULT_STAFF_PERMISSION_GROUP.permissions,
    isDefault: input.isDefault,
    isActive: input.isActive
  };
}

export function normalizeAdminStaffAccountInput(input: AdminStaffAccountInput) {
  const normalized = normalizeAdminAccountInput({
    provider: input.provider,
    providerAccountId: input.providerAccountId,
    label: input.label,
    email: input.email ?? undefined,
    role: input.role,
    isActive: input.isActive,
    metadata: input.metadata
  });

  return {
    ...normalized,
    permissionGroupKey: optionalText(input.permissionGroupKey)
  };
}

function parsePermissions(value: unknown): StaffPermissionKey[] {
  if (Array.isArray(value)) return normalizeStaffPermissionList(value.map(String));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return normalizeStaffPermissionList(parsed.map(String));
    } catch {
      return normalizeStaffPermissionList(value);
    }
  }
  return [];
}

function mapPermissionGroup(row: Omit<AdminPermissionGroup, 'permissions'> & { permissions: unknown }): AdminPermissionGroup {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    role: row.role,
    permissions: parsePermissions(row.permissions),
    isDefault: row.isDefault,
    isActive: row.isActive,
    updatedAt: row.updatedAt
  };
}

function mapStaffAccount(row: AdminStaffAccount & { provider?: string }): AdminStaffAccount {
  return {
    ...createAdminAccountReadinessRecord({
      id: row.id,
      provider: row.provider,
      providerAccountId: row.providerAccountId,
      label: row.label,
      email: row.email,
      role: row.role,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }),
    permissionGroupKey: row.permissionGroupKey ?? null
  };
}

export function buildStaffPermissionSettingsSnapshot(groups: AdminPermissionGroup[], accounts: AdminStaffAccount[]): StaffPermissionSettingsSnapshot {
  return {
    groups,
    accounts,
    summary: createAdminAccountReadinessSummary(accounts)
  };
}

export const staffPermissionSettingsService = {
  async snapshot(): Promise<StaffPermissionSettingsSnapshot> {
    if (!hasDatabase()) return buildStaffPermissionSettingsSnapshot([DEFAULT_STAFF_PERMISSION_GROUP], []);

    const [groupRows, accountRows] = await Promise.all([
      prisma.$queryRaw<(Omit<AdminPermissionGroup, 'permissions'> & { permissions: unknown })[]>`
        SELECT "id", "key", "label", "description", "role", "permissions", "isDefault", "isActive", "updatedAt"
        FROM "AdminPermissionGroup"
        ORDER BY "isDefault" DESC, "label" ASC
      `,
      prisma.$queryRaw<(AdminStaffAccount & { provider?: string })[]>`
        SELECT "id", "provider", "providerAccountId", "label", "email", "role", "permissionGroupKey", "isActive", "lastLoginAt", "createdAt", "updatedAt"
        FROM "AdminStaffAccount"
        ORDER BY "role" ASC, "label" ASC
      `
    ]);

    const groups = groupRows.length ? groupRows.map(mapPermissionGroup) : [DEFAULT_STAFF_PERMISSION_GROUP];
    const accounts = accountRows.map(mapStaffAccount);
    return buildStaffPermissionSettingsSnapshot(groups, accounts);
  },

  async updateGroup(input: AdminPermissionGroupInput): Promise<AdminPermissionGroup> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeAdminPermissionGroupInput(input);
    if (normalized.isDefault) {
      await prisma.$executeRaw`
        UPDATE "AdminPermissionGroup"
        SET "isDefault" = false, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "key" <> ${normalized.key}
      `;
    }

    const rows = await prisma.$queryRaw<(Omit<AdminPermissionGroup, 'permissions'> & { permissions: unknown })[]>`
      INSERT INTO "AdminPermissionGroup" ("key", "label", "description", "role", "permissions", "isDefault", "isActive")
      VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.role}, ${JSON.stringify(normalized.permissions)}::jsonb, ${normalized.isDefault}, ${normalized.isActive})
      ON CONFLICT ("key") DO UPDATE SET
        "label" = EXCLUDED."label",
        "description" = EXCLUDED."description",
        "role" = EXCLUDED."role",
        "permissions" = EXCLUDED."permissions",
        "isDefault" = EXCLUDED."isDefault",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "key", "label", "description", "role", "permissions", "isDefault", "isActive", "updatedAt"
    `;
    const group = mapPermissionGroup(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.staff_permission_group.update',
      entity: 'adminPermissionGroup',
      entityId: group.id,
      summary: `Updated staff permission group: ${group.label}`,
      metadata: {
        key: group.key,
        role: group.role,
        permissions: group.permissions,
        isDefault: group.isDefault,
        isActive: group.isActive
      }
    });

    return group;
  },

  async updateAccount(input: AdminStaffAccountInput): Promise<AdminStaffAccount> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeAdminStaffAccountInput(input);
    const rows = await prisma.$queryRaw<(AdminStaffAccount & { provider?: string })[]>`
      INSERT INTO "AdminStaffAccount" ("provider", "providerAccountId", "label", "email", "role", "permissionGroupKey", "isActive", "metadata")
      VALUES (${normalized.provider}, ${normalized.providerAccountId}, ${normalized.label}, ${normalized.email ?? null}, ${normalized.role}, ${normalized.permissionGroupKey}, ${normalized.isActive}, ${JSON.stringify(normalized.metadata ?? {})}::jsonb)
      ON CONFLICT ("provider", "providerAccountId") DO UPDATE SET
        "label" = EXCLUDED."label",
        "email" = EXCLUDED."email",
        "role" = EXCLUDED."role",
        "permissionGroupKey" = EXCLUDED."permissionGroupKey",
        "isActive" = EXCLUDED."isActive",
        "metadata" = EXCLUDED."metadata",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "provider", "providerAccountId", "label", "email", "role", "permissionGroupKey", "isActive", "lastLoginAt", "createdAt", "updatedAt"
    `;
    const account = mapStaffAccount(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.staff_account.update',
      entity: 'adminStaffAccount',
      entityId: account.id,
      summary: `Updated staff account: ${account.label}`,
      metadata: {
        providerAccountId: account.providerAccountId,
        email: account.email,
        role: account.role,
        permissionGroupKey: account.permissionGroupKey,
        isActive: account.isActive,
        assignmentKey: account.assignmentKey
      }
    });

    return account;
  }
};
