import type { AdminRole } from '@/lib/admin-auth-core';

export const ADMIN_MODULE_KEYS = [
  'overview',
  'products',
  'categories',
  'media',
  'homepage',
  'orders',
  'customers',
  'inquiries',
  'fulfillment',
  'promotions',
  'channels',
  'settings'
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULE_KEYS)[number];
export type AdminModuleAction = 'read' | 'write';

export type AdminModuleAccessPolicy = {
  key: AdminModuleKey;
  label: string;
  description: string;
  readRole: AdminRole;
  writeRole: AdminRole;
  readPermissions: string[];
  writePermissions: string[];
};

export type AdminModuleAccessDecision = {
  allowed: boolean;
  module: AdminModuleKey;
  action: AdminModuleAction;
  requiredRole: AdminRole;
  requiredPermissions: string[];
  missingPermissions: string[];
  reason: string;
};

export type AdminModuleAccessReadiness = {
  modules: AdminModuleAccessPolicy[];
  total: number;
  ownerWriteModules: number;
  staffWriteModules: number;
  permissionBackedModules: number;
};

export const ADMIN_MODULE_ACCESS_POLICIES: AdminModuleAccessPolicy[] = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'Operational dashboard and readiness cards.',
    readRole: 'staff',
    writeRole: 'owner',
    readPermissions: [],
    writePermissions: ['settings:write']
  },
  {
    key: 'products',
    label: 'Products',
    description: 'Catalog product and variant management.',
    readRole: 'staff',
    writeRole: 'owner',
    readPermissions: ['catalog:read'],
    writePermissions: ['catalog:write']
  },
  {
    key: 'categories',
    label: 'Categories',
    description: 'Catalog category and collection merchandising.',
    readRole: 'staff',
    writeRole: 'owner',
    readPermissions: ['catalog:read'],
    writePermissions: ['catalog:write']
  },
  {
    key: 'media',
    label: 'Media',
    description: 'Media library upload, tagging, and image metadata.',
    readRole: 'staff',
    writeRole: 'owner',
    readPermissions: ['catalog:read'],
    writePermissions: ['catalog:write']
  },
  {
    key: 'homepage',
    label: 'Homepage',
    description: 'Homepage copy, localization, and merchandising content.',
    readRole: 'staff',
    writeRole: 'owner',
    readPermissions: ['catalog:read'],
    writePermissions: ['catalog:write']
  },
  {
    key: 'orders',
    label: 'Orders',
    description: 'Order operations, payment state, timeline, discounts, and notifications.',
    readRole: 'staff',
    writeRole: 'staff',
    readPermissions: ['orders:read'],
    writePermissions: ['orders:write']
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'Customer profile, privacy-safe support fields, and customer timeline.',
    readRole: 'staff',
    writeRole: 'staff',
    readPermissions: ['customers:read'],
    writePermissions: ['customers:write']
  },
  {
    key: 'inquiries',
    label: 'Inquiries',
    description: 'Customer inquiries, follow-up notes, assignment, and workflow state.',
    readRole: 'staff',
    writeRole: 'staff',
    readPermissions: ['inquiries:read'],
    writePermissions: ['inquiries:write']
  },
  {
    key: 'fulfillment',
    label: 'Fulfillment',
    description: 'Shipment, delivery, pickup, courier, and fulfillment method operations.',
    readRole: 'staff',
    writeRole: 'staff',
    readPermissions: ['orders:read'],
    writePermissions: ['fulfillment:write']
  },
  {
    key: 'promotions',
    label: 'Promotions',
    description: 'Discounts, vouchers, eligibility, usage, and promotion audit controls.',
    readRole: 'staff',
    writeRole: 'owner',
    readPermissions: ['orders:read'],
    writePermissions: ['settings:write']
  },
  {
    key: 'channels',
    label: 'Channels',
    description: 'Channel, localization, pricing, and market-specific configuration.',
    readRole: 'staff',
    writeRole: 'owner',
    readPermissions: ['settings:read'],
    writePermissions: ['settings:write']
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Store, payment, notification, staff, permissions, and provider readiness settings.',
    readRole: 'owner',
    writeRole: 'owner',
    readPermissions: ['settings:read'],
    writePermissions: ['settings:write']
  }
];

const ROLE_RANK: Record<AdminRole, number> = {
  staff: 1,
  owner: 2
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeAdminModuleKey(value: string): AdminModuleKey | null {
  const normalized = normalizeText(value);
  return ADMIN_MODULE_KEYS.includes(normalized as AdminModuleKey) ? normalized as AdminModuleKey : null;
}

export function getAdminModuleAccessPolicy(module: AdminModuleKey) {
  return ADMIN_MODULE_ACCESS_POLICIES.find((policy) => policy.key === module) ?? ADMIN_MODULE_ACCESS_POLICIES[0];
}

function roleMeetsRequirement(actualRole: AdminRole, requiredRole: AdminRole) {
  return ROLE_RANK[actualRole] >= ROLE_RANK[requiredRole];
}

function missingPermissions(requiredPermissions: string[], permissions: string[]) {
  const granted = new Set(permissions.map(normalizeText));
  return requiredPermissions.filter((permission) => !granted.has(permission));
}

export function canAccessAdminModule(role: AdminRole, permissions: string[], module: AdminModuleKey, action: AdminModuleAction): AdminModuleAccessDecision {
  const policy = getAdminModuleAccessPolicy(module);
  const requiredRole = action === 'write' ? policy.writeRole : policy.readRole;
  const requiredPermissions = action === 'write' ? policy.writePermissions : policy.readPermissions;

  if (!roleMeetsRequirement(role, requiredRole)) {
    return {
      allowed: false,
      module,
      action,
      requiredRole,
      requiredPermissions,
      missingPermissions: requiredPermissions,
      reason: `${requiredRole} role is required for ${module}:${action}.`
    };
  }

  if (role === 'owner') {
    return {
      allowed: true,
      module,
      action,
      requiredRole,
      requiredPermissions,
      missingPermissions: [],
      reason: 'Owner role grants module access.'
    };
  }

  const missing = missingPermissions(requiredPermissions, permissions);
  return {
    allowed: missing.length === 0,
    module,
    action,
    requiredRole,
    requiredPermissions,
    missingPermissions: missing,
    reason: missing.length ? `Missing permissions: ${missing.join(', ')}.` : 'Role and permission requirements are satisfied.'
  };
}

export function buildAdminModuleAccessReadiness(policies = ADMIN_MODULE_ACCESS_POLICIES): AdminModuleAccessReadiness {
  return {
    modules: policies,
    total: policies.length,
    ownerWriteModules: policies.filter((policy) => policy.writeRole === 'owner').length,
    staffWriteModules: policies.filter((policy) => policy.writeRole === 'staff').length,
    permissionBackedModules: policies.filter((policy) => policy.readPermissions.length || policy.writePermissions.length).length
  };
}
