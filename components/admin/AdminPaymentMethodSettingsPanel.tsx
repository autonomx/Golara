import {
  buildPaymentMethodReadinessNotes,
  type PaymentMethodSetting
} from '@/lib/settings/payment-method-settings';

export function AdminPaymentMethodSettingsPanel({ methods, databaseReady }: { methods: PaymentMethodSetting[]; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">DigiKala-style payment methods</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Default enabled payment lanes mirror a DigiKala-style stack: Iranian IPG, wallet/store credit, installment credit, bank transfer, and cash/pay-on-delivery. Private DigiPay APIs are not connected until provider credentials and adapters are added.</p>
      </div>
      {!databaseReady ? <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing the default enabled method stack.</div> : null}
      <div className="mt-6 grid gap-4">
        {methods.map((method) => {
          const notes = buildPaymentMethodReadinessNotes(method, process.env);
          return (
            <article key={method.key} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-950">{method.label}</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">{method.description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${method.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{method.isActive ? 'enabled' : 'disabled'}</span>
              </div>
              <dl className="grid gap-3 text-sm md:grid-cols-4">
                <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Type</dt><dd className="mt-1 font-semibold text-stone-900">{method.methodType}</dd></div>
                <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Provider</dt><dd className="mt-1 font-semibold text-stone-900">{method.providerKey}</dd></div>
                <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Capture</dt><dd className="mt-1 font-semibold text-stone-900">{method.captureMode}</dd></div>
                <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Settlement</dt><dd className="mt-1 font-semibold text-stone-900">{method.settlementMode}</dd></div>
              </dl>
              {notes.length ? <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Readiness notes</p><ul className="mt-2 list-disc pl-5">{notes.map((note) => <li key={note}>{note}</li>)}</ul></div> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
