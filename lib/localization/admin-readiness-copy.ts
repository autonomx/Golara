import type { RuntimeReadiness } from '@/lib/runtime-readiness';
import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import type { InquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications-core';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey, createAdminTranslator } from '@/lib/localization/admin-copy';

type ReadinessIssue = { code: string; summary: string; detail: string };

const fa = {
  'Admin auth': 'احراز هویت مدیریت',
  'Admin password/session secret missing.': 'رمز عبور مدیریت یا راز نشست وجود ندارد.',
  'Checkout': 'پرداخت',
  'Checkout gateway configuration is ready.': 'پیکربندی درگاه پرداخت آماده است.',
  'Checkout gateway settings have no blockers.': 'تنظیمات درگاه پرداخت مانعی ندارد.',
  'Checkout is assisted by staff.': 'پرداخت با کمک تیم انجام می شود.',
  'Checkout readiness': 'آمادگی پرداخت',
  'Checkout readiness is blocked.': 'آمادگی پرداخت مسدود است.',
  'Checkout readiness needs an operating decision.': 'آمادگی پرداخت نیازمند تصمیم عملیاتی است.',
  'Checkout remains inquiry-first.': 'پرداخت همچنان ابتدا از مسیر درخواست مشتری انجام می شود.',
  'Checkout review needed.': 'بازبینی پرداخت لازم است.',
  'Configure DATABASE_URL before production writes or public launch.': 'پیش از نوشتن در تولید یا راه اندازی عمومی، DATABASE_URL را تنظیم کنید.',
  'Configured but not signed in.': 'تنظیم شده اما وارد نشده اید.',
  'Confirm checkout mode and fallback process before launch.': 'پیش از راه اندازی، حالت پرداخت و فرایند جایگزین را تایید کنید.',
  'Confirm the manual monitoring process before launch.': 'پیش از راه اندازی، فرایند پایش دستی را تایید کنید.',
  'DATABASE_URL is configured.': 'DATABASE_URL تنظیم شده است.',
  'DATABASE_URL is missing.': 'DATABASE_URL وجود ندارد.',
  'Fix checkout configuration blockers before enabling gateway mode.': 'پیش از فعال کردن حالت درگاه، مانع های پیکربندی پرداخت را رفع کنید.',
  'Fix notification blockers before relying on automated alerting.': 'پیش از اتکا به هشدار خودکار، مانع های اعلان را رفع کنید.',
  'Gateway checkout mode has no online provider selected.': 'حالت پرداخت درگاهی هیچ ارائه دهنده آنلاین انتخاب شده ای ندارد.',
  'Inquiry notifications': 'اعلان های درخواست مشتری',
  'Inquiry notifications are blocked.': 'اعلان های درخواست مشتری مسدود هستند.',
  'Inquiry notifications are log-only.': 'اعلان های درخواست مشتری فقط در گزارش ها ثبت می شوند.',
  'Inquiry notifications have no blockers.': 'اعلان های درخواست مشتری مانعی ندارند.',
  'Inquiry notifications need an operating decision.': 'اعلان های درخواست مشتری نیازمند تصمیم عملیاتی هستند.',
  'Inquiry notification configuration is ready.': 'پیکربندی اعلان درخواست مشتری آماده است.',
  'Inquiry notification review needed.': 'بازبینی اعلان درخواست مشتری لازم است.',
  'Iranian gateway merchant identifier is missing.': 'شناسه پذیرنده درگاه ایرانی وجود ندارد.',
  'Iranian gateway requires Toman domestic currency.': 'درگاه ایرانی به ارز داخلی تومان نیاز دارد.',
  'Media storage': 'ذخیره سازی رسانه',
  'Mode': 'حالت',
  'Notification mode': 'حالت اعلان',
  'Orders can be prepared by staff, but final payment/confirmation may still happen outside automated checkout.': 'سفارش ها می توانند توسط تیم آماده شوند، اما پرداخت یا تایید نهایی ممکن است هنوز خارج از پرداخت خودکار انجام شود.',
  'Overseas checkout falls back to WhatsApp.': 'پرداخت خارج از کشور به واتساپ بازمی گردد.',
  'Password auth is the current temporary gate. Replace it with account/provider auth before full production.': 'احراز هویت با رمز عبور دروازه موقت فعلی است. پیش از تولید کامل، آن را با احراز هویت حساب/ارائه دهنده جایگزین کنید.',
  'Preview, development, and test can use seeded catalog fallback when the database is unavailable.': 'پیش نمایش، توسعه و تست می توانند هنگام در دسترس نبودن پایگاه داده از پشتیبان کاتالوگ نمونه استفاده کنند.',
  'Products continue to route through inquiry/staff follow-up instead of direct payment.': 'محصولات همچنان به جای پرداخت مستقیم از مسیر درخواست مشتری و پیگیری تیم عبور می کنند.',
  'Production runtime is missing DATABASE_URL.': 'اجرای تولید فاقد DATABASE_URL است.',
  'Production runtime is missing required database configuration.': 'اجرای تولید فاقد پیکربندی ضروری پایگاه داده است.',
  'Production runtime will throw on missing database configuration or production repository read failures instead of silently using seed data.': 'اجرای تولید هنگام نبود پیکربندی پایگاه داده یا شکست خواندن repository تولید خطا می دهد و بی صدا از داده نمونه استفاده نمی کند.',
  'Production-safe': 'ایمن برای تولید',
  'Providers': 'ارائه دهندگان',
  'Prisma-backed reads and writes can use the configured database.': 'خواندن و نوشتن مبتنی بر Prisma می تواند از پایگاه داده تنظیم شده استفاده کند.',
  'Seed fallback allowed': 'پشتیبان داده نمونه مجاز است',
  'Seed fallback is allowed in this runtime.': 'پشتیبان داده نمونه در این اجرا مجاز است.',
  'Seed fallback is disabled for this runtime.': 'پشتیبان داده نمونه برای این اجرا غیرفعال است.',
  'Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET before enabling staff CMS writes.': 'پیش از فعال کردن ویرایش CMS برای تیم، ADMIN_PASSWORD و ADMIN_SESSION_SECRET را تنظیم کنید.',
  'Set CHECKOUT_DOMESTIC_CURRENCY=TOMAN for Iranian provider checkout.': 'برای پرداخت با ارائه دهنده ایرانی، CHECKOUT_DOMESTIC_CURRENCY=TOMAN را تنظیم کنید.',
  'Set CHECKOUT_DOMESTIC_CURRENCY=TOMAN for ZarinPal domestic checkout.': 'برای پرداخت داخلی زرین پال، CHECKOUT_DOMESTIC_CURRENCY=TOMAN را تنظیم کنید.',
  'Set INQUIRY_NOTIFICATION_WEBHOOK_URL or switch INQUIRY_NOTIFICATION_MODE to log before production deploy.': 'پیش از استقرار تولید، INQUIRY_NOTIFICATION_WEBHOOK_URL را تنظیم کنید یا INQUIRY_NOTIFICATION_MODE را به log تغییر دهید.',
  'Set IRANIAN_GATEWAY_MERCHANT_ID before enabling the Iranian gateway adapter.': 'پیش از فعال کردن آداپتور درگاه ایرانی، IRANIAN_GATEWAY_MERCHANT_ID را تنظیم کنید.',
  'Set STRIPE_SECRET_KEY before enabling Stripe checkout.': 'پیش از فعال کردن پرداخت Stripe، STRIPE_SECRET_KEY را تنظیم کنید.',
  'Set ZARINPAL_MERCHANT_ID before enabling ZarinPal checkout.': 'پیش از فعال کردن زرین پال، ZARINPAL_MERCHANT_ID را تنظیم کنید.',
  'Signed in.': 'وارد شده اید.',
  'Staff must monitor the admin inbox until webhook, email, or WhatsApp delivery is configured.': 'تا زمان پیکربندی وب هوک، ایمیل یا ارسال واتساپ، تیم باید صندوق درخواست های مدیریت را پایش کند.',
  'Stripe overseas currency cannot be Toman.': 'ارز پرداخت خارجی Stripe نمی تواند تومان باشد.',
  'Stripe secret key is missing.': 'کلید محرمانه Stripe وجود ندارد.',
  'The DATABASE_URL value is intentionally hidden.': 'مقدار DATABASE_URL عمدا پنهان شده است.',
  'This mirrors the assisted overseas purchase pattern and requires staff follow-up.': 'این حالت الگوی خرید خارجی با کمک تیم را بازتاب می دهد و به پیگیری تیم نیاز دارد.',
  'Temporary password/session auth can gate staff workflows.': 'احراز هویت موقت با رمز عبور/نشست می تواند مسیرهای کاری تیم را محافظت کند.',
  'Unsupported inquiry notification mode': 'حالت اعلان درخواست مشتری پشتیبانی نمی شود',
  'Use INQUIRY_NOTIFICATION_MODE=log or INQUIRY_NOTIFICATION_MODE=webhook before production deploy.': 'پیش از استقرار تولید از INQUIRY_NOTIFICATION_MODE=log یا INQUIRY_NOTIFICATION_MODE=webhook استفاده کنید.',
  'Use USD or CAD for Stripe overseas checkout.': 'برای پرداخت خارجی Stripe از USD یا CAD استفاده کنید.',
  'Use ZarinPal, another Iranian provider, or Stripe for gateway mode, or switch CHECKOUT_MODE to assisted/inquiry.': 'برای حالت درگاه از زرین پال، ارائه دهنده ایرانی دیگر یا Stripe استفاده کنید، یا CHECKOUT_MODE را به assisted/inquiry تغییر دهید.',
  'Webhook notifications are selected but the webhook URL is missing.': 'اعلان های وب هوک انتخاب شده اند اما نشانی وب هوک وجود ندارد.',
  'ZarinPal checkout requires Toman domestic currency.': 'پرداخت زرین پال به ارز داخلی تومان نیاز دارد.',
  'ZarinPal merchant identifier is missing.': 'شناسه پذیرنده زرین پال وجود ندارد.',
  assisted: 'با کمک تیم',
  blocked: 'مسدود',
  checkout_assisted_mode: 'حالت پرداخت با کمک تیم',
  checkout_inquiry_mode: 'حالت درخواست مشتری برای پرداخت',
  gateway: 'درگاهی',
  gateway_mode_without_online_provider: 'حالت درگاه بدون ارائه دهنده آنلاین',
  inquiry: 'درخواست مشتری',
  iranian: 'درگاه ایرانی',
  iranian_gateway_currency_invalid: 'ارز درگاه ایرانی نامعتبر است',
  iranian_gateway_merchant_missing: 'شناسه پذیرنده درگاه ایرانی وجود ندارد',
  log: 'ثبت در گزارش ها',
  manual: 'دستی',
  no: 'خیر',
  none: 'هیچ کدام',
  notification_log_only: 'اعلان ها فقط در گزارش ثبت می شوند',
  notification_mode_unsupported: 'حالت اعلان پشتیبانی نمی شود',
  notification_webhook_url_missing: 'نشانی وب هوک اعلان وجود ندارد',
  overseas_whatsapp_fallback: 'جایگزین واتساپ برای خرید خارجی',
  ready: 'آماده',
  stripe: 'Stripe',
  stripe_currency_invalid: 'ارز Stripe نامعتبر است',
  stripe_secret_missing: 'کلید محرمانه Stripe وجود ندارد',
  warning: 'نیازمند تصمیم',
  webhook: 'وب هوک',
  yes: 'بله',
  zarinpal: 'زرین پال',
  zarinpal_currency_invalid: 'ارز زرین پال نامعتبر است',
  zarinpal_merchant_missing: 'شناسه پذیرنده زرین پال وجود ندارد'
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

export function readinessValue(value: string, locale?: SupportedLocale | string | null) {
  return t(locale, value);
}

export function readinessModeLine(mode: string, locale?: SupportedLocale | string | null) {
  return `${t(locale, 'Mode')}: ${readinessValue(mode, locale)}`;
}

export function readinessProvidersLine(providers: string[], locale?: SupportedLocale | string | null) {
  return `${t(locale, 'Providers')}: ${providers.length ? providers.map((provider) => readinessValue(provider, locale)).join(', ') : readinessNone(locale)}`;
}

export function readinessIssueSummary(issue: ReadinessIssue | undefined, fallback: string, locale?: SupportedLocale | string | null) {
  return t(locale, issue?.summary ?? fallback);
}

export function readinessIssueDetail(issue: ReadinessIssue | undefined, fallback: string, locale?: SupportedLocale | string | null) {
  return t(locale, issue?.detail ?? fallback);
}

export function readinessIssueLine(issue: ReadinessIssue, locale?: SupportedLocale | string | null) {
  return `${readinessValue(issue.code, locale)}: ${readinessIssueDetail(issue, issue.detail, locale)}`;
}

export function readinessCardLabel(label: string, value: string, locale?: SupportedLocale | string | null) {
  return `${t(locale, label)} (${readinessValue(value, locale)})`;
}

export function runtimeModeSummary(runtimeReadiness: RuntimeReadiness, locale?: SupportedLocale | string | null) {
  if (!runtimeReadiness.productionSafe) return t(locale, 'Production runtime is missing DATABASE_URL.');
  return adminLocaleKey(locale) === 'fa' ? `در حال اجرا در حالت ${readinessValue(runtimeReadiness.appMode, locale)}.` : `Running in ${runtimeReadiness.appMode} mode.`;
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
    ? `حالت اعلان ${readinessValue(readiness.mode, locale)} هیچ مانع یا هشدار آمادگی ندارد.`
    : `Notification mode ${readiness.mode} has no readiness blockers or warnings.`;
}

export function checkoutReadyDetail(readiness: PaymentGatewayReadiness, locale?: SupportedLocale | string | null) {
  return adminLocaleKey(locale) === 'fa'
    ? `حالت پرداخت ${readinessValue(readiness.mode, locale)} هیچ مانع یا هشدار آمادگی ندارد.`
    : `Checkout mode ${readiness.mode} has no readiness blockers or warnings.`;
}

export function getReadinessCopy(key: string, locale?: SupportedLocale | string | null) {
  return t(locale, key);
}
