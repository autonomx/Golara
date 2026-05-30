import type { RuntimeReadiness } from '@/lib/runtime-readiness';

type ReadinessStatus = 'ready' | 'warning' | 'blocked';

type ReadinessItem = {
  label: string;
  status: ReadinessStatus;
  summary: string;
  detail: string;
};

type AdminReadinessPanelProps = {
  runtimeReadiness: RuntimeReadiness;
  authConfigured: boolean;
  authenticated: boolean;
  notificationMode: string;
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

function yesNo(value: boolean) {
  return value ? 'yes' : 'no';
}

function notificationReadiness(mode: string): Pick<ReadinessItem, 'status' | 'summary' | 'detail'> {
  if (mode === 'webhook') {
    return {
      status: 'ready',
      summary: 'Webhook notification mode is configured.',
      detail: 'New inquiries will POST a provider-agnostic JSON payload to the configured webhook URL. Verify delivery before relying on it for operations.'
    };
  }

  if (mode === 'log') {
    return {
      status: 'warning',
      summary: 'Log-only notification mode.',
      detail: 'Staff must monitor the admin inbox until webhook, email, or WhatsApp delivery is configured.'
    };
  }

  return {
    status: 'warning',
    summary: `Unsupported notification mode: ${mode}.`,
    detail: 'The notification layer will fall back to server logs until this mode is implemented.'
  };
}

function mediaStorageReadiness(runtimeReadiness: RuntimeReadiness): Pick<ReadinessItem, 'status' | 'summary' | 'detail'> {
  const mediaStorage = runtimeReadiness.mediaStorage;
  if (mediaStorage.productionSafe && mediaStorage.configured) {
    return { status: 'ready', summary: mediaStorage.summary, detail: mediaStorage.detail };
  }
  if (runtimeReadiness.appMode === 'production') {
    return { status: 'blocked', summary: mediaStorage.summary, detail: mediaStorage.detail };
  }
  return { status: 'warning', summary: mediaStorage.summary, detail: mediaStorage.detail };
}

export function AdminReadinessPanel({ runtimeReadiness, authConfigured, authenticated, notificationMode }: AdminReadinessPanelProps) {
  const notificationStatus = notificationReadiness(notificationMode);
  const mediaStatus = mediaStorageReadiness(runtimeReadiness);
  const databaseReady = runtimeReadiness.databaseUrlPresent;
  const items: ReadinessItem[] = [
    {
      label: 'Runtime mode',
      status: runtimeReadiness.productionSafe ? (runtimeReadiness.appMode === 'production' ? 'ready' : 'warning') : 'blocked',
      summary: runtimeReadiness.productionSafe ? `Running in ${runtimeReadiness.appMode} mode.` : 'Production runtime is missing DATABASE_URL.',
      detail: `APP_MODE: ${runtimeReadiness.appMode}. NODE_ENV: ${runtimeReadiness.nodeEnv}. VERCEL_ENV: ${runtimeReadiness.vercelEnv}. Production-safe: ${yesNo(runtimeReadiness.productionSafe)}.`
    },
    {
      label: 'Database',
      status: databaseReady ? 'ready' : runtimeReadiness.seedFallbackAllowed ? 'warning' : 'blocked',
      summary: databaseReady ? 'DATABASE_URL is configured.' : 'DATABASE_URL is missing.',
      detail: databaseReady
        ? 'CMS reads and writes can use Prisma-backed content. The DATABASE_URL value is intentionally hidden.'
        : `Seed fallback allowed: ${yesNo(runtimeReadiness.seedFallbackAllowed)}. Configure DATABASE_URL before production writes or public launch.`
    },
    {
      label: 'Seed fallback policy',
      status: runtimeReadiness.seedFallbackAllowed ? 'warning' : 'ready',
      summary: runtimeReadiness.seedFallbackAllowed ? 'Seed fallback is allowed in this runtime.' : 'Seed fallback is disabled for this runtime.',
      detail: runtimeReadiness.seedFallbackAllowed
        ? 'Preview, development, and test can use seeded catalog fallback when the database is unavailable.'
        : 'Production runtime will throw on missing database configuration or production repository read failures instead of silently using seed data.'
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
      ...notificationStatus
    },
    {
      label: `Media storage (${runtimeReadiness.mediaStorage.provider})`,
      ...mediaStatus
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
