import type { RuntimeReadiness } from '@/lib/runtime-readiness';
import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import type { InquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications-core';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey, createAdminTranslator } from '@/lib/localization/admin-copy';

type ReadinessContext = {
  runtimeReadiness: RuntimeReadiness;
  authConfigured: boolean;
  authenticated: boolean;
  notificationReadiness: InquiryNotificationReadiness;
  checkoutReadiness: PaymentGatewayReadiness;
  locale?: SupportedLocale | string | null;
};

const fa = {
  'Admin auth': 'احراز هویت مدیریت',
  'Checkout readiness is blocked.': 'آمادگی پرداخت مسدود است.',
  'Checkout readiness needs an operating decision.': 'آمادگی پرداخت نیازمند تصمیم عملیاتی است.',
  'Configure DATABASE_URL before production writes or public launch.': 'پیش از نوشتن در تولید یا راه اندازی عمومی، DATABASE_URL را تنظیم کنید.',
  'Configured but not signed in.': 'تنظیم شده اما وارد نشده اید.',
  'Confirm checkout mode and fallback process before launch.': 'پیش از راه اندازی، حالت پرداخت و فرایند جایگزین را تایید کنید.',
  'Confirm the manual monitoring process before launch.': 'پیش از راه اندازی، فرایند پایش دستی را تایید کنید.',
  'DATABASE_URL is configured.': 'DATABASE_URL تنظیم شده است.',
  'DATABASE_URL is missing.': 'DATABASE_URL وجود ندارد.',
  'Fix checkout configuration blockers before enabling gateway mode.': 'پیش از فعال کردن حالت درگاه، مانع های پیکربندی پرداخت را رفع کنید.',
  'Fix notification blockers before relying on automated alerting.': 'پیش از اتکا به هشدار خودکار، مانع های اعلان را رفع کنید.',
  'Inquiry notifications are blocked.': 'اعلان های درخواست مشتری مسدود هستند.',
  'Inquiry notifications need an operating decision.': 'اعلان های درخواست مشتری نیازمند تصمیم عملیاتی هستند.',
  'Inquiry notification configuration is ready.': 'پیکربندی اعلان درخواست مشتری آماده است.',
  'Password auth is the current temporary gate. Replace it with account/provider auth before full production.': 'احراز هویت با رمز عبور دروازه موقت فعلی است. پیش از تولید کامل، آن را با احراز هویت حساب/ارائه دهنده جایگزین کنید.',
  'Preview, development, and test can use seeded catalog fallback when the database is unavailable.': 'پیش نمایش، توسعه و تست می توانند هنگام در دسترس نبودن پایگاه داده از پشتیبان کاتالوگ نمونه استفاده کنند.',
  'Production runtime is missing DATABASE_URL.': 'اجرای تولید فاقد DATABASE_URL است.',
  'Production runtime will throw on missing database configuration or production repository read failures instead of silently using seed data.': 'اجرای تولید هنگام نبود پیکربندی پایگاه داده یا شکست خواندن repository تولید خطا می دهد و بی صدا از داده نمونه استفاده نمی کند.',
  'Seed fallback is allowed in this runtime.': 'پشتیبان داده نمونه در این اجرا مجاز است.',
  'Seed fallback is disabled for this runtime.': 'پشتیبان داده نمونه برای این اجرا غیرفعال است.',
  'Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET before enabling staff CMS writes.': 'پیش از فعال کردن ویرایش CMS برای تیم، ADMIN_PASSWORD و ADMIN_SESSION_SECRET را تنظیم کنید.',
  'Signed in.': 'وارد شده اید.',
  'The DATABASE_URL value is intentionally hidden.': 'مقدار DATABASE_URL عمدا پنهان شده است.',
  'CMS reads and writes can use Prisma-backed content.': 'خواندن و نوشتن CMS می تواند از محتوای مبتنی بر Prisma استفاده کند.',
  'Checkout gateway configuration is ready.': 'پیکربندی درگاه پرداخت آماده است.',
  'has no readiness blockers or warnings.': 'هیچ مانع یا هشدار آمادگی ندارد.',
  'Mode': 'حالت',
  'Providers': 'ارائه دهندگان',
  'none': 'هیچ کدام',
  'Production-safe': 'ایمن برای تولید',
  yes: 'بله',
  no: 'خیر'
} as const;

function t(locale: SupportedLocale | string | null | undefined, key: string) {
  if (adminLocaleKey(locale) === 'fa') return fa[key as keyof typeof fa] ?? createAdminTranslator(locale)(key);
  return key;
}

export function readinessYesNo(value: boolean, locale?: SupportedLocale | string | null) {
  return t(locale, value ? 'yes' : 'no');
}

export function readinessNone(locale?: SupportedLocale | string | null) {
  return t(locale, 'none');
}

export function readinessModeLine(mode: string, locale?: SupportedLocale | string | null) {
  return `${t(locale, 'Mode')}: ${mode}`;
}

export function readinessProvidersLine(providers: string[], locale?: SupportedLocale | string | null) {
  return `${t(locale, 'Providers')}: ${providers.length ? providers.join(', ') : readinessNone(locale)}`;
}

export function runtimeModeSummary(runtimeReadiness: RuntimeReadiness, locale?: SupportedLocale | string | null) {
  if (!runtimeReadiness.productionSafe) return t(locale, 'Production runtime is missing DATABASE_URL.');
  return adminLocaleKey(locale) === 'fa' ? `در حال اجرا در حالت ${runtimeReadiness.appMode}.` : `Running in ${runtimeReadiness.appMode} mode.`;
}

export function runtimeModeDetail(runtimeReadiness: RuntimeReadiness, locale?: SupportedLocale | string | null) {
  return `APP_MODE: ${runtimeReadiness.appMode}. NODE_ENV: ${runtimeReadiness.nodeEnv}. VERCEL_ENV: ${runtimeReadiness.vercelEnv}. ${t(locale, 'Production-safe')}: ${readinessYesNo(runtimeReadiness.productionSafe, locale)}.`;
}

export function databaseSummary(runtimeReadiness: RuntimeReadiness, locale?: SupportedLocale | string | null) {
  return t(locale, runtimeReadiness.databaseUrlPresent ? 'DATABASE_URL is configured.' : 'DATABASE_URL is missing.');
}

export function databaseDetail(runtimeReadiness: RuntimeReadiness, locale?: SupportedLocale | string | null) {
  if (runtimeReadiness.databaseUrlPresent) {
    return `${t(locale, 'CMS reads and writes can use Prisma-backed content.')} ${t(locale, 'The DATABASE_URL value is intentionally hidden.')}`;
  }
  return `${t(locale, 'Seed fallback allowed')}: ${readinessYesNo(runtimeReadiness.seedFallbackAllowed, locale)}. ${t(locale, 'Configure DATABASE_URL before production writes or public launch.')}`;
}

export function seedFallbackSummary(runtimeReadiness: RuntimeReadiness, locale?: SupportedLocale | string | null) {
  return t(locale, runtimeReadiness.seedFallbackAllowed ? 'Seed fallback is allowed in this runtime.' : 'Seed fallback is disabled for this runtime.');
}

export function seedFallbackDetail(runtimeReadiness: RuntimeReadiness, locale?: SupportedLocale | string | null) {
  return t(
    locale,
    runtimeReadiness.seedFallbackAllowed
      ? 'Preview, development, and test can use seeded catalog fallback when the database is unavailable.'
      : 'Production runtime will throw on missing database configuration or production repository read failures instead of silently using seed data.'
  );
}

export function adminAuthSummary(authConfigured: boolean, authenticated: boolean, locale?: SupportedLocale | string | null) {
  return t(locale, authConfigured ? (authenticated ? 'Signed in.' : 'Configured but not signed in.') : 'Admin password/session secret missing.');
}

export function adminAuthDetail(authConfigured: boolean, locale?: SupportedLocale | string | null) {
  return t(
    locale,
    authConfigured
      ? 'Password auth is the current temporary gate. Replace it with account/provider auth before full production.'
      : 'Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET before enabling staff CMS writes.'
  );
}

export function notificationReadyDetail(readiness: InquiryNotificationReadiness, locale?: SupportedLocale | string | null) {
  return adminLocaleKey(locale) === 'fa'
    ? `حالت اعلان ${readiness.mode} هیچ مانع یا هشدار آمادگی ندارد.`
    : `Notification mode ${readiness.mode} has no readiness blockers or warnings.`;
}

export function checkoutReadyDetail(readiness: PaymentGatewayReadiness, locale?: SupportedLocale | string | null) {
  return adminLocaleKey(locale) === 'fa'
    ? `حالت پرداخت ${readiness.mode} هیچ مانع یا هشدار آمادگی ندارد.`
    : `Checkout mode ${readiness.mode} has no readiness blockers or warnings.`;
}

export function getReadinessCopy(key: string, locale?: SupportedLocale | string | null) {
  return t(locale, key);
}
