type ReadinessStatus = 'ready' | 'warning' | 'blocked';

type ReadinessItem = {
  label: string;
  status: ReadinessStatus;
  summary: string;
  detail: string;
};

type AdminReadinessPanelProps = {
  databaseReady: boolean;
  authConfigured: boolean;
  authenticated: boolean;
  notificationMode: string;
  hasProductionStorage: boolean;
};

const statusClasses: Record<ReadinessStatus, string> = {
  ready: 'border-olive/25 bg-olive/5 text-olive',
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
  blocked: 'border-red-200 bg-red-50 text-red-800'
};

const statusLabels: Record<ReadinessStatus, string> = {
  ready: 'Ready',
  warning: 'Needs decision',
  blocked: 'Blocked'
};

export function AdminReadinessPanel({ databaseReady, authConfigured, authenticated, notificationMode, hasProductionStorage }: AdminReadinessPanelProps) {
  const items: ReadinessItem[] = [
    {
      label: 'Database',
      status: databaseReady ? 'ready' : 'blocked',
      summary: databaseReady ? 'DATABASE_URL is configured.' : 'DATABASE_URL is missing.',
      detail: databaseReady
        ? 'CMS reads and writes can use Prisma-backed content.'
        : 'The storefront can still use seeded fallback content, but CMS writes and inquiry storage need PostgreSQL.'
    },
    {
      label: 'Admin auth',
      status: authConfigured ? (authenticated ? 'ready' : 'warning') : 'blocked',
      summary: authConfigured ? (authenticated ? 'Signed in.' : 'Configured but not signed in.') : 'Admin password/session secret missing.',
      detail: authConfigured
        ? 'Password auth is the current temporary gate. Replace it with account/provider auth before full production.'
        : 'Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET before enabling staff CMS writes.'
    },
    {
      label: 'Inquiry notifications',
      status: notificationMode === 'log' ? 'warning' : 'ready',
      summary: notificationMode === 'log' ? 'Log-only notification mode.' : `Notification mode: ${notificationMode}.`,
      detail: notificationMode === 'log'
        ? 'Staff must monitor the admin inbox until email or WhatsApp delivery is implemented.'
        : 'Verify provider credentials and delivery behavior before relying on automated alerts.'
    },
    {
      label: 'Media storage',
      status: hasProductionStorage ? 'ready' : 'warning',
      summary: hasProductionStorage ? 'Production storage flag is configured.' : 'Local/dev uploads are still the default.',
      detail: hasProductionStorage
        ? 'Confirm the storage provider integration is wired before launch.'
        : 'Move uploads to S3, Cloudinary, Supabase Storage, or another object store for serverless/multi-instance hosting.'
    }
  ];

  return (
    <section id="readiness" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Production readiness</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">Launch checklist status</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Operational checks based on <code>docs/PRODUCTION_CHECKLIST.md</code>. These cards are advisory and do not change CMS write permissions.
          </p>
        </div>
        <a href="/docs/PRODUCTION_CHECKLIST.md" className="rounded-full border border-rosewood/15 px-4 py-2 text-sm font-semibold text-rosewood">
          Checklist doc
        </a>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.label} className={`rounded-3xl border p-5 ${statusClasses[item.status]}`}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-2xl text-rosewood">{item.label}</h3>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {statusLabels[item.status]}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold">{item.summary}</p>
            <p className="mt-2 text-sm leading-6 text-stone-700">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
