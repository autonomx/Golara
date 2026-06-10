import type { RuntimeReadiness } from '@/lib/runtime-readiness';
import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import type { InquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications-core';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { createAdminTranslator } from '@/lib/localization/admin-copy';
import {
  adminAuthDetail,
  adminAuthSummary,
  checkoutReadyDetail,
  databaseDetail,
  databaseSummary,
  getReadinessCopy,
  notificationReadyDetail,
  readinessModeLine,
  readinessProvidersLine,
  runtimeModeDetail,
  runtimeModeSummary,
  seedFallbackDetail,
  seedFallbackSummary
} from '@/lib/localization/admin-readiness-copy';

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

function issueLines(readiness: { blockers: Array<{ code: string; detail: string }>; warnings: Array<{ code: string; detail: string }> }) {
  return [
    ...readiness.blockers.map((issue) => `${issue.code}: ${issue.detail}`),
    ...readiness.warnings.map((issue) => `${issue.code}: ${issue.detail}`)
  ];
}

function notificationReadinessStatus(
  readiness: InquiryNotificationReadiness,
  locale?: SupportedLocale | string | null
): Pick<ReadinessItem, 'status' | 'summary' | 'detail' | 'extras'> {
  if (readiness.blockers.length > 0) {
    return {
      status: 'blocked',
      summary: readiness.blockers[0]?.summary ?? getReadinessCopy('Inquiry notifications are blocked.', locale),
      detail: readiness.blockers[0]?.detail ?? getReadinessCopy('Fix notification blockers before relying on automated alerting.', locale),
      extras: issueLines(readiness)
    };
  }

  if (readiness.warnings.length > 0) {
    return {
      status: 'warning',
      summary: readiness.warnings[0]?.summary ?? getReadinessCopy('Inquiry notifications need an operating decision.', locale),
      detail: readiness.warnings[0]?.detail ?? getReadinessCopy('Confirm the manual monitoring process before launch.', locale),
      extras: issueLines(readiness)
    };
  }

  return {
    status: 'ready',
    summary: getReadinessCopy('Inquiry notification configuration is ready.', locale),
    detail: notificationReadyDetail(readiness, locale),
    extras: []
  };
}

function checkoutReadinessStatus(
  readiness: PaymentGatewayReadiness,
  locale?: SupportedLocale | string | null
): Pick<ReadinessItem, 'status' | 'summary' | 'detail' | 'extras'> {
  const providerLine = readinessProvidersLine(readiness.providers, locale);

  if (readiness.blockers.length > 0) {
    return {
      status: 'blocked',
      summary: readiness.blockers[0]?.summary ?? getReadinessCopy('Checkout readiness is blocked.', locale),
      detail: readiness.blockers[0]?.detail ?? getReadinessCopy('Fix checkout configuration blockers before enabling gateway mode.', locale),
      extras: [readinessModeLine(readiness.mode, locale), providerLine, ...issueLines(readiness)]
    };
  }

  if (readiness.warnings.length > 0) {
    return {
      status: 'warning',
      summary: readiness.warnings[0]?.summary ?? getReadinessCopy('Checkout readiness needs an operating decision.', locale),
      detail: readiness.warnings[0]?.detail ?? getReadinessCopy('Confirm checkout mode and fallback process before launch.', locale),
      extras: [readinessModeLine(readiness.mode, locale), providerLine, ...issueLines(readiness)]
    };
  }

  return {
    status: 'ready',
    summary: getReadinessCopy('Checkout gateway configuration is ready.', locale),
    detail: checkoutReadyDetail(readiness, locale),
    extras: [providerLine]
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
  const notificationStatus = notificationReadinessStatus(notificationReadiness, locale);
  const checkoutStatus = checkoutReadinessStatus(checkoutReadiness, locale);
  const mediaStatus = mediaStorageReadiness(runtimeReadiness);
  const databaseReady = runtimeReadiness.databaseUrlPresent;
  const items: ReadinessItem[] = [
    {
      label: 'Runtime mode',
      status: runtimeReadiness.productionSafe ? (runtimeReadiness.appMode === 'production' ? 'ready' : 'warning') : 'blocked',
      summary: runtimeModeSummary(runtimeReadiness, locale),
      detail: runtimeModeDetail(runtimeReadiness, locale)
    },
    {
      label: 'Database',
      status: databaseReady ? 'ready' : runtimeReadiness.seedFallbackAllowed ? 'warning' : 'blocked',
      summary: databaseSummary(runtimeReadiness, locale),
      detail: databaseDetail(runtimeReadiness, locale)
    },
    {
      label: 'Seed fallback policy',
      status: runtimeReadiness.seedFallbackAllowed ? 'warning' : 'ready',
      summary: seedFallbackSummary(runtimeReadiness, locale),
      detail: seedFallbackDetail(runtimeReadiness, locale)
    },
    {
      label: 'Admin auth',
      status: authConfigured ? (authenticated ? 'ready' : 'warning') : 'blocked',
      summary: adminAuthSummary(authConfigured, authenticated, locale),
      detail: adminAuthDetail(authConfigured, locale)
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
