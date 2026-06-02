import { updateShippingDeliverySettingAction } from '@/app/admin/settings/actions';
import { formatSameDayCutoff, type ShippingDeliverySetting } from '@/lib/settings/shipping-delivery-settings';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

function centsToAmount(cents?: number | null) {
  return cents == null ? '' : String((cents / 100).toFixed(2));
}

export function AdminShippingDeliverySettingsPanel({ setting, databaseReady }: { setting: ShippingDeliverySetting; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">Shipping and delivery</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Configure local delivery fees, delivery radius, postal code coverage, pickup instructions, and same-day cutoff rules used by staff and checkout planning.</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <form action={updateShippingDeliverySettingAction} className="mt-6 grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Key
            <input className={inputClass} name="key" defaultValue={setting.key} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Label
            <input className={inputClass} name="label" defaultValue={setting.label} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Timezone
            <input className={inputClass} name="timezone" defaultValue={setting.timezone} disabled={!databaseReady} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Description
          <input className={inputClass} name="description" defaultValue={setting.description ?? ''} disabled={!databaseReady} />
        </label>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Delivery fee
            <input className={inputClass} name="deliveryFee" inputMode="decimal" defaultValue={centsToAmount(setting.deliveryFeeCents)} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Free delivery minimum
            <input className={inputClass} name="freeDeliveryMinimum" inputMode="decimal" defaultValue={centsToAmount(setting.freeDeliveryMinimumCents)} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Minimum order
            <input className={inputClass} name="minimumOrder" inputMode="decimal" defaultValue={centsToAmount(setting.minimumOrderCents)} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Radius km
            <input className={inputClass} name="deliveryRadiusKm" type="number" defaultValue={setting.deliveryRadiusKm ?? ''} disabled={!databaseReady} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Delivery postal codes
          <textarea className={`${inputClass} min-h-24 font-mono text-xs`} name="deliveryPostalCodes" defaultValue={setting.deliveryPostalCodes.join('\n')} placeholder="One postal code or prefix per line" disabled={!databaseReady} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Pickup address
          <input className={inputClass} name="pickupAddress" defaultValue={setting.pickupAddress ?? ''} disabled={!databaseReady} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Delivery instructions
          <textarea className={`${inputClass} min-h-24`} name="deliveryInstructions" defaultValue={setting.deliveryInstructions ?? ''} disabled={!databaseReady} />
        </label>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Same-day cutoff minutes after midnight
            <input className={inputClass} name="sameDayCutoffMinutes" type="number" min="0" max="1439" defaultValue={setting.sameDayCutoffMinutes ?? ''} disabled={!databaseReady} />
            <span className="text-xs font-medium text-stone-500">Current display: {formatSameDayCutoff(setting.sameDayCutoffMinutes)}</span>
          </label>
          <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 md:self-end">
            <input type="hidden" name="isActive" value="false" />
            <input name="isActive" type="checkbox" defaultChecked={setting.isActive} disabled={!databaseReady} />
            Active delivery settings
          </label>
        </div>
        <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
          Save shipping/delivery settings
        </button>
      </form>
    </section>
  );
}
