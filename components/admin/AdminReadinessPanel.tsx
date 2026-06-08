import type { RuntimeReadiness } from '@/lib/runtime-readiness';
import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import type { InquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications-core';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { createAdminTranslator } from '@/lib/localization/admin-copy';

export type ReadinessStatus = 'ready' | 'warning' | 'blocked';

type ReadinessItem = {
  label: string;
  status: ReadinessStatus;
  summary: string;
  detail: string;
  extras?: string[];
};

type AdminReadinessPanelProps = {
  runtimeReadiness: RuntimeReadiness;
  authConfigured: boolean;
  authenticated: boolean;
  notificationReadiness: InquiryNotificationReadiness;
  notificationRetryRunbook: string[];
  checkoutReadiness: PaymentGatewayReadiness;
  locale?: SupportedLocale | string | null;
};

const statusClasses: Record<ReadinessStatus, string> = {
  ready: 'border-olive/25 bg-olive/5 text-olive',
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
  blocked: 'border-red-200 bg-red-50 text-red-800'
};

const statusLabels: Record<ReadinessStatus, string> = { ready: 'Ready', warning: 'Needs decision', blocked: 'Blocked' };

function yesNo(value: boolean) {
  return value ? 'yes' : 'no';
}

function issueLines(readiness: { blockers: Array<{ code: string; detail: string }>; warnings: Array<{ code: string; detail: string }> }) {
  return [
    ...readiness.blockers.map((issue) => `${issue.code}: ${issue.detail}`),
    ...readiness.warnings.map((issue) => `${issue.code}: ${issue.detail}`)
  ];
}

function notificationReadinessStatus(readiness: InquiryNotificationReadiness): Pick<ReadinessItem, 'status' | 'summary' | 'detail' | 'extras'> {
  if (readiness.blockers.length > 0) {
    return {
      status: 'blocked',
      summary: readiness.blockers[0]?.summary ?? 'Inquiry notifications are blocked.',
      detail: readiness.blockers[0]?.detail ?? 'Fix notification blockers before relying on automated alerting.',
      extras: issueLines(readiness)
    };
  }

  if (readiness.warnings.length > 0) {
    return {
      status: 'warning',
      summary: readiness.warnings[0]?.summary ?? 'Inquiry notifications need an operating decision.',
      detail: readiness.warnings[0]?.detail ?? 'Confirm the manual monitoring process before launch.',
      extras: issueLines(readiness)
    };
  }

  return {
    status: 'ready',
    summary: 'Inquiry notification configuration is ready.',
    detail: `Notification mode ${readiness.mode} has no readiness blockers or warnings.`,
    extras: []
  };
}

function checkoutReadinessStatus(readiness: PaymentGatewayReadiness): Pick<ReadinessItem, 'status' | 'summary' | 'detail' | 'extras'> {
  const providers = readiness.providers.length ? readiness.providers.join(', ') : 'none';

  if (readiness.blockers.length > 0) {
    return {
      status: 'blocked',
      summary: readiness.blockers[0]?.summary ?? 'Checkout readiness is blocked.',
      detail: readiness.blockers[0]?.detail ?? 'Fix checkout configuration blockers before enabling gateway mode.',
      extras: [`Mode: ${readiness.mode}`, `Providers: ${providers}`, ...issueLines(readiness)]
    };
  }

  if (readiness.warnings.length > 0) {
    return {
      status: 'warning',
      summary: readiness.warnings[0]?.summary ?? 'Checkout readiness needs an operating decision.',
      detail: readiness.warnings[0]?.detail ?? 'Confirm checkout mode and fallback process before launch.',
      extras: [`Mode: ${readiness.mode}`, `Providers: ${providers}`, ...issueLines(readiness)]
    };
  }

  return {
    status: 'ready',
    summary: 'Checkout gateway configuration is ready.',
    detail: `Checkout mode ${readiness.mode} has no readiness blockers or warnings.`,
    extras: [`Providers: ${providers}`]
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

function ReadinessCard({ item, t }: { item: ReadinessItem; t: (key: string) => string }) {
  return (
    <article className={`rounded-3xl border p-5 ${statusClasses[item.status]}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl text-rosewood">{t(item.label)}</h3>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
          {t(statusLabels[item.status])}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold">{t(item.summary)}</p>
      <p className="mt-2 text-sm leading-6 text-stone-700">{t(item.detail)}</p>
      {item.extras?.length ? (
        <ul className="mt-3 grid gap-1 text-xs leading-5 text-stone-700">
          {item.extras.map((extra) => <li key={extra}>• {extra}</li>)}
        </ul>
      ) : null}
    </article>
  );
}

export function AdminReadinessPanel({ runtimeReadiness, authConfigured, authenticated, notificationReadiness, notificationRetryRunbook, checkoutReadiness, locale }: AdminReadinessPanelProps) {
  const t = createAdminTranslator(locale);
  const notificationStatus = notificationReadinessStatus(notificationReadiness);
  const checkoutStatus = checkoutReadinessStatus(checkoutReadiness);
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
      label: `Inquiry notifications (${notificationReadiness.mode})`,
      ...notificationStatus
    },
    {
      label: `Checkout (${checkoutReadiness.mode})`,
      ...checkoutStatus
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
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{t('Production readiness')}</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">{t('Launch checklist status')}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            {t('Operational checks based on')} <code>docs/PRODUCTION_CHECKLIST.md</code>. {t('These cards are advisory and do not change CMS write permissions.')}
          </p>
        </div>
        <a href="/docs/PRODUCTION_CHECKLIST.md" className="rounded-full border border-rosewood/15 px-4 py-2 text-sm font-semibold text-rosewood">
          {t('Checklist doc')}
        </a>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => <ReadinessCard key={item.label} item={item} t={t} />)}
      </div>
      <div className="mt-5 rounded-3xl border border-olive/20 bg-cream p-5 text-sm text-stone-700">
        <p className="font-semibold text-rosewood">{t('Inquiry notification retry runbook')}</p>
        <ol className="mt-3 grid gap-2 pl-5 list-decimal leading-6">
          {notificationRetryRunbook.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </div>
    </section>
  );
}
