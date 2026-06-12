import assert from 'node:assert/strict';
import Module from 'node:module';

import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionCookieValue,
  type AdminAuthConfig
} from '../../lib/admin-auth-core';

type SettingsActionsModule = {
  default?: SettingsActions;
} & Partial<SettingsActions>;

type SettingsActions = {
  updateApiTokenManagementAction: (formData: FormData) => Promise<void>;
  updatePaymentProviderSettingAction: (formData: FormData) => Promise<void>;
  updateStaffAccountAction: (formData: FormData) => Promise<void>;
  updateStaffPermissionGroupAction: (formData: FormData) => Promise<void>;
};

const staffConfig: AdminAuthConfig = {
  password: 'staff-password',
  sessionSecret: 'staff-session-secret',
  label: 'Staff User',
  email: 'staff@example.invalid',
  role: 'staff',
  provider: 'password'
};

function setField(formData: FormData, name: string, value: string) {
  formData.set(name, value);
  return formData;
}

function apiTokenForm() {
  return [
    ['key', 'internal-api-token'],
    ['label', 'Internal API token'],
    ['description', 'Internal operations token'],
    ['tokenValue', 'golara_live_sample_value'],
    ['tokenPrefix', 'golara_live'],
    ['scopes', 'orders:read'],
    ['integrationAppKey', 'internal-ops'],
    ['expiresAt', '2026-12-31T00:00:00.000Z']
  ].reduce((formData, [name, value]) => setField(formData, name, value), new FormData());
}

function paymentProviderForm() {
  return [
    ['key', 'default-payment-provider'],
    ['label', 'Default payment provider'],
    ['description', 'Default checkout routing'],
    ['checkoutMode', 'domestic'],
    ['domesticProvider', 'zarinpal'],
    ['overseasProvider', 'stripe'],
    ['domesticCurrency', 'IRT'],
    ['overseasCurrency', 'USD'],
    ['overseasFallback', 'manual']
  ].reduce((formData, [name, value]) => setField(formData, name, value), new FormData());
}

function staffPermissionGroupForm() {
  return [
    ['key', 'staff-operations'],
    ['label', 'Staff operations'],
    ['description', 'Order and inquiry operations'],
    ['role', 'staff'],
    ['permissions', 'orders:read,orders:write,inquiries:read,inquiries:write']
  ].reduce((formData, [name, value]) => setField(formData, name, value), new FormData());
}

function staffAccountForm() {
  return [
    ['provider', 'password'],
    ['providerAccountId', 'staff@example.invalid'],
    ['label', 'Staff User'],
    ['email', 'staff@example.invalid'],
    ['role', 'staff'],
    ['permissionGroupKey', 'staff-operations']
  ].reduce((formData, [name, value]) => setField(formData, name, value), new FormData());
}

function requireSettingsActions(actionsModule: SettingsActionsModule): SettingsActions {
  const actions = actionsModule.default ?? actionsModule;
  assert.equal(typeof actions.updateApiTokenManagementAction, 'function');
  assert.equal(typeof actions.updatePaymentProviderSettingAction, 'function');
  assert.equal(typeof actions.updateStaffAccountAction, 'function');
  assert.equal(typeof actions.updateStaffPermissionGroupAction, 'function');
  return actions as SettingsActions;
}

function withStaffAdminRequestScope() {
  const cookieValue = createAdminSessionCookieValue(
    staffConfig,
    Date.now(),
    '0123456789abcdef0123456789abcdef'
  );
  const headers = new Headers({
    host: 'golara.example',
    origin: 'https://golara.example',
    'x-forwarded-proto': 'https'
  });
  const originalLoad = (Module as any)._load;

  (Module as any)._load = function patchedLoad(request: string, parent: unknown, isMain: boolean) {
    if (request === 'next/headers') {
      return {
        cookies: async () => ({
          get: (name: string) => name === ADMIN_SESSION_COOKIE_NAME ? { value: cookieValue } : undefined
        }),
        headers: async () => headers
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  const originalEnv = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ADMIN_LABEL: process.env.ADMIN_LABEL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_ROLE: process.env.ADMIN_ROLE,
    ADMIN_IDENTITY_PROVIDER: process.env.ADMIN_IDENTITY_PROVIDER
  };

  process.env.ADMIN_PASSWORD = staffConfig.password;
  process.env.ADMIN_SESSION_SECRET = staffConfig.sessionSecret;
  process.env.ADMIN_LABEL = staffConfig.label;
  process.env.ADMIN_EMAIL = staffConfig.email;
  process.env.ADMIN_ROLE = staffConfig.role;
  process.env.ADMIN_IDENTITY_PROVIDER = staffConfig.provider;

  return () => {
    (Module as any)._load = originalLoad;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

export async function runAdminOwnerActionDenialTests() {
  const restore = withStaffAdminRequestScope();

  try {
    const actionsModule = await import('../../app/admin/settings/actions') as SettingsActionsModule;
    const actions = requireSettingsActions(actionsModule);

    await assert.rejects(
      () => actions.updateApiTokenManagementAction(apiTokenForm()),
      /owner admin role is required for this CMS action\./,
      'staff admins must not update API token management settings'
    );
    await assert.rejects(
      () => actions.updatePaymentProviderSettingAction(paymentProviderForm()),
      /owner admin role is required for this CMS action\./,
      'staff admins must not update payment provider settings'
    );
    await assert.rejects(
      () => actions.updateStaffPermissionGroupAction(staffPermissionGroupForm()),
      /owner admin role is required for this CMS action\./,
      'staff admins must not update staff permission groups'
    );
    await assert.rejects(
      () => actions.updateStaffAccountAction(staffAccountForm()),
      /owner admin role is required for this CMS action\./,
      'staff admins must not update staff accounts'
    );
  } finally {
    restore();
  }

  console.log('admin-owner-action-denial.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminOwnerActionDenialTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
