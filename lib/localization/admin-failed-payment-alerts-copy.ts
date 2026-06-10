import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey } from '@/lib/localization/admin-copy';

const en = {
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  declined: 'Declined',
  email: 'Email',
  error: 'Error',
  failed: 'Failed',
  notification: 'Notification',
  payment: 'Payment',
  refunded: 'Refunded',
  retry_scheduled: 'Retry scheduled',
  sms: 'SMS',
  to: 'to',
  attempt: 'attempt',
  unknown: 'Unknown',
  voided: 'Voided'
} as const;

const fa: Record<keyof typeof en, string> = {
  cancelled: 'لغو شده',
  canceled: 'لغو شده',
  declined: 'رد شده',
  email: 'ایمیل',
  error: 'خطا',
  failed: 'ناموفق',
  notification: 'اعلان',
  payment: 'پرداخت',
  refunded: 'بازپرداخت شده',
  retry_scheduled: 'تلاش دوباره زمان بندی شده',
  sms: 'پیامک',
  to: 'به',
  attempt: 'تلاش',
  unknown: 'نامشخص',
  voided: 'باطل شده'
};

type FailedPaymentAlertCopyKey = keyof typeof en;

function normalizeKey(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'unknown';
}

export function getAdminFailedPaymentAlertCopy(key: string, locale?: SupportedLocale | string | null) {
  const normalized = normalizeKey(key);
  if (adminLocaleKey(locale) === 'fa' && normalized in fa) return fa[normalized as FailedPaymentAlertCopyKey];
  if (normalized in en) return en[normalized as FailedPaymentAlertCopyKey];
  return key;
}

export function formatAdminFailedPaymentAlertStatus(status: string, locale?: SupportedLocale | string | null) {
  return getAdminFailedPaymentAlertCopy(status, locale);
}

export function formatAdminFailedPaymentAlertKind(kind: string, locale?: SupportedLocale | string | null) {
  return getAdminFailedPaymentAlertCopy(kind, locale);
}

export function formatAdminFailedPaymentAlertTitle(alert: { kind: string; status: string; title: string }, locale?: SupportedLocale | string | null) {
  const status = formatAdminFailedPaymentAlertStatus(alert.status, locale);
  const kind = formatAdminFailedPaymentAlertKind(alert.kind, locale);
  if (adminLocaleKey(locale) === 'fa') return `${kind} ${status}`;
  return `${status} ${kind}`;
}

export function formatAdminFailedPaymentNotificationDetail(
  alert: { kind: string; detail: string },
  locale?: SupportedLocale | string | null
) {
  if (adminLocaleKey(locale) !== 'fa' || alert.kind !== 'notification') return alert.detail;
  return alert.detail.replace(/\bto\b/g, getAdminFailedPaymentAlertCopy('to', locale)).replace(/\battempt\b/g, getAdminFailedPaymentAlertCopy('attempt', locale));
}
