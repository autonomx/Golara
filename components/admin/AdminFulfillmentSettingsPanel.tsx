import { updateFulfillmentMethodSettingAction } from '@/app/admin/settings/actions';
import { AdminApiTokenManagementPanel } from '@/components/admin/AdminApiTokenManagementPanel';
import { AdminDashboardExtensionMountPointsPanel } from '@/components/admin/AdminDashboardExtensionMountPointsPanel';
import { AdminImportExportJobTrackingPanel } from '@/components/admin/AdminImportExportJobTrackingPanel';
import { AdminIntegrationAppRegistryPanel } from '@/components/admin/AdminIntegrationAppRegistryPanel';
import { AdminModuleAccessSettingsPanel } from '@/components/admin/AdminModuleAccessSettingsPanel';
import { AdminNotificationProviderSettingsPanel } from '@/components/admin/AdminNotificationProviderSettingsPanel';
import { AdminPaymentProviderSettingsPanel } from '@/components/admin/AdminPaymentProviderSettingsPanel';
import { AdminProviderDiagnosticsPanel } from '@/components/admin/AdminProviderDiagnosticsPanel';
import { AdminShippingDeliverySettingsPanel } from '@/components/admin/AdminShippingDeliverySettingsPanel';
import { AdminStaffPermissionSettingsPanel } from '@/components/admin/AdminStaffPermissionSettingsPanel';
import { AdminTaxCategorySettingsPanel } from '@/components/admin/AdminTaxCategorySettingsPanel';
import { AdminWebhookConfigurationPanel } from '@/components/admin/AdminWebhookConfigurationPanel';
import { AdminWebhookEventLogPanel } from '@/components/admin/AdminWebhookEventLogPanel';
import type { FulfillmentMethodSetting } from '@/lib/catalog';
import { apiTokenManagementService } from '@/lib/settings/api-token-management';
import { dashboardExtensionMountPointService } from '@/lib/settings/dashboard-extension-mount-points';
import { importExportJobTrackingService } from '@/lib/settings/import-export-job-tracking';
import { integrationAppRegistryService } from '@/lib/settings/integration-app-registry';
import { notificationProviderSettingsService } from '@/lib/settings/notification-provider-settings';
import { paymentProviderSettingsService } from '@/lib/settings/payment-provider-settings';
import { providerDiagnosticsService } from '@/lib/settings/provider-diagnostics';
import { shippingDeliverySettingsService } from '@/lib/settings/shipping-delivery-settings';
import { staffPermissionSettingsService } from '@/lib/settings/staff-permission-settings';
import { taxCategorySettingsService } from '@/lib/settings/tax-category-settings';
import { webhookConfigurationService } from '@/lib/settings/webhook-configuration';
import { webhookEventLogService } from '@/lib/settings/webhook-event-log';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

function Toggle({ label, name, defaultChecked, disabled }: { label: string; name: string; defaultChecked: boolean; disabled: boolean }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
      <input type="hidden" name={name} value="false" />
      <input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />
      {label}
    </label>
  );
}

export async function AdminFulfillmentSettingsPanel({ methods, databaseReady }: { methods: FulfillmentMethodSetting[]; databaseReady: boolean }) {
  const [shippingDeliverySetting, taxCategorySettings, paymentProviderSettings, notificationProviderSettings, staffPermissionSnapshot, webhookConfigurations, webhookEventLogSummary, integrationAppRegistrySummary, apiTokenManagementSummary, dashboardExtensionMountPointSummary, importExportJobSummary, providerDiagnosticsSummary] = await Promise.all([
    shippingDeliverySettingsService.get(),
    taxCategorySettingsService.list(),
    paymentProviderSettingsService.list(),
    notificationProviderSettingsService.list(),
    staffPermissionSettingsService.snapshot(),
    webhookConfigurationService.list(),
    webhookEventLogService.summary(10),
    integrationAppRegistryService.summary(),
    apiTokenManagementService.summary(),
    dashboardExtensionMountPointService.summary(),
    importExportJobTrackingService.summary(10),
    providerDiagnosticsService.summary()
  ]);

  return (
    <>
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Fulfillment methods</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Configure delivery, pickup, courier, and manual fulfillment options for checkout and staff workflows.</p>
        </div>
        {!databaseReady ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured.</div>
        ) : null}
        <div className="mt-6 grid gap-4">
          {methods.map((method) => (
            <form key={method.key} action={updateFulfillmentMethodSettingAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
              <input type="hidden" name="key" value={method.key} />
              <div className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.4fr]">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Label
                  <input className={inputClass} name="label" defaultValue={method.label} disabled={!databaseReady} />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Key
                  <input className={inputClass} value={method.key} readOnly />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Sort
                  <input className={inputClass} name="sortOrder" type="number" defaultValue={method.sortOrder} disabled={!databaseReady} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Description
                <input className={inputClass} name="description" defaultValue={method.description ?? ''} disabled={!databaseReady} />
              </label>
              <div className="grid gap-3 md:grid-cols-4">
                <Toggle label="Active" name="isActive" defaultChecked={method.isActive} disabled={!databaseReady} />
                <Toggle label="Default" name="isDefault" defaultChecked={method.isDefault} disabled={!databaseReady} />
                <Toggle label="Address" name="requiresAddress" defaultChecked={method.requiresAddress} disabled={!databaseReady} />
                <Toggle label="Scheduling" name="requiresScheduling" defaultChecked={method.requiresScheduling} disabled={!databaseReady} />
              </div>
              <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
                Save method
              </button>
            </form>
          ))}
        </div>
      </section>
      <AdminShippingDeliverySettingsPanel setting={shippingDeliverySetting} databaseReady={databaseReady} />
      <AdminTaxCategorySettingsPanel categories={taxCategorySettings} databaseReady={databaseReady} />
      <AdminPaymentProviderSettingsPanel settings={paymentProviderSettings} databaseReady={databaseReady} />
      <AdminNotificationProviderSettingsPanel settings={notificationProviderSettings} databaseReady={databaseReady} />
      <AdminProviderDiagnosticsPanel summary={providerDiagnosticsSummary} />
      <AdminIntegrationAppRegistryPanel summary={integrationAppRegistrySummary} databaseReady={databaseReady} />
      <AdminApiTokenManagementPanel summary={apiTokenManagementSummary} databaseReady={databaseReady} />
      <AdminDashboardExtensionMountPointsPanel summary={dashboardExtensionMountPointSummary} databaseReady={databaseReady} />
      <AdminImportExportJobTrackingPanel summary={importExportJobSummary} databaseReady={databaseReady} />
      <AdminWebhookConfigurationPanel settings={webhookConfigurations} databaseReady={databaseReady} />
      <AdminWebhookEventLogPanel summary={webhookEventLogSummary} databaseReady={databaseReady} />
      <AdminStaffPermissionSettingsPanel snapshot={staffPermissionSnapshot} databaseReady={databaseReady} />
      <AdminModuleAccessSettingsPanel />
    </>
  );
}
