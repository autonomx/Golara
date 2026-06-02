import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';
import { normalizeIntegrationAppKey } from '@/lib/settings/integration-app-registry';

export const DASHBOARD_EXTENSION_MOUNT_LOCATIONS = ['operations_home', 'order_detail', 'customer_detail', 'product_detail', 'settings_integrations', 'custom'] as const;
export const DASHBOARD_EXTENSION_ROLES = ['owner', 'manager', 'staff', 'viewer'] as const;

export type DashboardExtensionMountLocation = (typeof DASHBOARD_EXTENSION_MOUNT_LOCATIONS)[number];
export type DashboardExtensionRole = (typeof DASHBOARD_EXTENSION_ROLES)[number];

export type DashboardExtensionMountPoint = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  mountLocation: DashboardExtensionMountLocation;
  integrationAppKey?: string | null;
  requiredRoles: DashboardExtensionRole[];
  requiredPermissions: string[];
  isInternal: boolean;
  isActive: boolean;
  sortOrder: number;
  updatedAt?: Date;
};

export type DashboardExtensionMountPointInput = {
  key: string;
  label: string;
  description?: string | null;
  mountLocation?: string | null;
  integrationAppKey?: string | null;
  requiredRoles?: string[] | string | null;
  requiredPermissions?: string[] | string | null;
  isInternal: boolean;
  isActive: boolean;
  sortOrder?: number | string | null;
};

export type DashboardExtensionMountPointSummary = {
  total: number;
  active: number;
  internal: number;
  external: number;
  inactive: number;
  byLocation: Record<DashboardExtensionMountLocation, number>;
  entries: DashboardExtensionMountPoint[];
};

export const DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT: DashboardExtensionMountPoint = {
  id: 'dashboard-extension-internal-tools',
  key: 'internal-tools-overview',
  label: 'Internal tools overview',
  description: 'Default dashboard extension mount point for internal operations tools and future custom admin modules.',
  mountLocation: 'settings_integrations',
  integrationAppKey: 'default-webhook-app',
  requiredRoles: ['owner'],
  requiredPermissions: ['admin:extensions:read'],
  isInternal: true,
  isActive: false,
  sortOrder: 100
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeDashboardExtensionKey(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.key;
}

export function normalizeDashboardExtensionLabel(value?: string | null) {
  return optionalText(value) ?? DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.label;
}

export function normalizeDashboardExtensionDescription(value?: string | null) {
  return optionalText(value);
}

function normalizeEnum<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return allowed.includes(normalized as T) ? normalized as T : fallback;
}

export function normalizeDashboardMountLocation(value?: string | null): DashboardExtensionMountLocation {
  return normalizeEnum(value, DASHBOARD_EXTENSION_MOUNT_LOCATIONS, DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.mountLocation);
}

export function normalizeDashboardExtensionRole(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return DASHBOARD_EXTENSION_ROLES.includes(normalized as DashboardExtensionRole) ? normalized as DashboardExtensionRole : null;
}

export function normalizeDashboardExtensionRoles(values?: string[] | string | null) {
  if (!values) return DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.requiredRoles;
  const rawValues = Array.isArray(values) ? values : values.split(/[\n,]+/g);
  const normalized = Array.from(new Set(rawValues.map(normalizeDashboardExtensionRole).filter(Boolean) as DashboardExtensionRole[])).sort();
  return normalized.length ? normalized : DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.requiredRoles;
}

export function normalizeDashboardExtensionPermission(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, ':').replace(/:+/g, ':').replace(/^:|:$/g, '');
  if (!normalized.includes(':')) return null;
  return normalized;
}

export function normalizeDashboardExtensionPermissions(values?: string[] | string | null) {
  if (!values) return DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.requiredPermissions;
  const rawValues = Array.isArray(values) ? values : values.split(/[\n,]+/g);
  const normalized = Array.from(new Set(rawValues.map(normalizeDashboardExtensionPermission).filter(Boolean) as string[])).sort();
  return normalized.length ? normalized : DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.requiredPermissions;
}

export function normalizeDashboardExtensionSortOrder(value?: number | string | null) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.sortOrder), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.sortOrder;
  return Math.max(0, Math.min(10000, Math.trunc(parsed)));
}

export function normalizeDashboardExtensionMountPointInput(input: DashboardExtensionMountPointInput): DashboardExtensionMountPointInput {
  return {
    key: normalizeDashboardExtensionKey(input.key),
    label: normalizeDashboardExtensionLabel(input.label),
    description: normalizeDashboardExtensionDescription(input.description),
    mountLocation: normalizeDashboardMountLocation(input.mountLocation),
    integrationAppKey: input.integrationAppKey ? normalizeIntegrationAppKey(input.integrationAppKey) : null,
    requiredRoles: normalizeDashboardExtensionRoles(input.requiredRoles),
    requiredPermissions: normalizeDashboardExtensionPermissions(input.requiredPermissions),
    isInternal: input.isInternal,
    isActive: input.isActive,
    sortOrder: normalizeDashboardExtensionSortOrder(input.sortOrder)
  };
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return value.split(/[\n,]+/g);
    }
  }
  return [];
}

function mapDashboardExtensionMountPoint(row: Omit<DashboardExtensionMountPoint, 'requiredRoles' | 'requiredPermissions'> & { requiredRoles: unknown; requiredPermissions: unknown }): DashboardExtensionMountPoint {
  return {
    id: row.id,
    key: row.key,
    label: normalizeDashboardExtensionLabel(row.label),
    description: row.description ?? null,
    mountLocation: normalizeDashboardMountLocation(row.mountLocation),
    integrationAppKey: row.integrationAppKey ?? null,
    requiredRoles: normalizeDashboardExtensionRoles(parseStringArray(row.requiredRoles)),
    requiredPermissions: normalizeDashboardExtensionPermissions(parseStringArray(row.requiredPermissions)),
    isInternal: row.isInternal,
    isActive: row.isActive,
    sortOrder: normalizeDashboardExtensionSortOrder(row.sortOrder),
    updatedAt: row.updatedAt
  };
}

export function buildDashboardExtensionMountPointSummary(entries: DashboardExtensionMountPoint[]): DashboardExtensionMountPointSummary {
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if (a.mountLocation !== b.mountLocation) return a.mountLocation.localeCompare(b.mountLocation);
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });
  const byLocation = Object.fromEntries(DASHBOARD_EXTENSION_MOUNT_LOCATIONS.map((location) => [location, 0])) as Record<DashboardExtensionMountLocation, number>;
  for (const entry of sortedEntries) byLocation[entry.mountLocation] += 1;

  return {
    total: sortedEntries.length,
    active: sortedEntries.filter((entry) => entry.isActive).length,
    internal: sortedEntries.filter((entry) => entry.isInternal).length,
    external: sortedEntries.filter((entry) => !entry.isInternal).length,
    inactive: sortedEntries.filter((entry) => !entry.isActive).length,
    byLocation,
    entries: sortedEntries
  };
}

export const dashboardExtensionMountPointService = {
  async list(): Promise<DashboardExtensionMountPoint[]> {
    if (!hasDatabase()) return [DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT];

    const rows = await prisma.$queryRaw<(Omit<DashboardExtensionMountPoint, 'requiredRoles' | 'requiredPermissions'> & { requiredRoles: unknown; requiredPermissions: unknown })[]>`
      SELECT "id", "key", "label", "description", "mountLocation", "integrationAppKey", "requiredRoles", "requiredPermissions", "isInternal", "isActive", "sortOrder", "updatedAt"
      FROM "DashboardExtensionMountPoint"
      ORDER BY "isActive" DESC, "mountLocation" ASC, "sortOrder" ASC, "label" ASC
    `;

    return rows.length ? rows.map(mapDashboardExtensionMountPoint) : [DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT];
  },

  async summary(): Promise<DashboardExtensionMountPointSummary> {
    return buildDashboardExtensionMountPointSummary(await this.list());
  },

  async update(input: DashboardExtensionMountPointInput): Promise<DashboardExtensionMountPoint> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeDashboardExtensionMountPointInput(input);
    const rows = await prisma.$queryRaw<(Omit<DashboardExtensionMountPoint, 'requiredRoles' | 'requiredPermissions'> & { requiredRoles: unknown; requiredPermissions: unknown })[]>`
      INSERT INTO "DashboardExtensionMountPoint" ("key", "label", "description", "mountLocation", "integrationAppKey", "requiredRoles", "requiredPermissions", "isInternal", "isActive", "sortOrder")
      VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.mountLocation}, ${normalized.integrationAppKey}, ${JSON.stringify(normalized.requiredRoles)}::jsonb, ${JSON.stringify(normalized.requiredPermissions)}::jsonb, ${normalized.isInternal}, ${normalized.isActive}, ${normalized.sortOrder})
      ON CONFLICT ("key") DO UPDATE SET
        "label" = EXCLUDED."label",
        "description" = EXCLUDED."description",
        "mountLocation" = EXCLUDED."mountLocation",
        "integrationAppKey" = EXCLUDED."integrationAppKey",
        "requiredRoles" = EXCLUDED."requiredRoles",
        "requiredPermissions" = EXCLUDED."requiredPermissions",
        "isInternal" = EXCLUDED."isInternal",
        "isActive" = EXCLUDED."isActive",
        "sortOrder" = EXCLUDED."sortOrder",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "key", "label", "description", "mountLocation", "integrationAppKey", "requiredRoles", "requiredPermissions", "isInternal", "isActive", "sortOrder", "updatedAt"
    `;
    const entry = mapDashboardExtensionMountPoint(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.dashboard_extension_mount_point.update',
      entity: 'dashboardExtensionMountPoint',
      entityId: entry.id,
      summary: `Updated dashboard extension mount point: ${entry.label}`,
      metadata: {
        key: entry.key,
        mountLocation: entry.mountLocation,
        integrationAppKey: entry.integrationAppKey,
        requiredRoles: entry.requiredRoles,
        requiredPermissions: entry.requiredPermissions,
        isInternal: entry.isInternal,
        isActive: entry.isActive,
        sortOrder: entry.sortOrder
      }
    });

    return entry;
  }
};
