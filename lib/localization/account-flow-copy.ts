export type LoginStatusCopyLocale = 'en' | 'fa';

export type LoginStatusCopyKey =
  | 'code-sent'
  | 'cooldown'
  | 'rate_limited'
  | 'missing_or_expired'
  | 'invalid_code'
  | 'too_many_attempts'
  | 'database-required'
  | 'request-failed'
  | 'verify-failed';

type LoginStatusCopyRegistry = Record<LoginStatusCopyLocale, Record<LoginStatusCopyKey, string>>;

const loginStatusCopy: LoginStatusCopyRegistry = {
  en: {
    'code-sent': 'Verification code sent. In development, check the server logs for the code.',
    cooldown: 'A code was sent recently. Please wait before requesting another one.',
    rate_limited: 'Too many code requests. Please try again later.',
    missing_or_expired: 'The code is missing or expired. Request a new code.',
    invalid_code: 'The code was not correct. Please try again.',
    too_many_attempts: 'Too many attempts. Request a new code.',
    'database-required': 'Customer login requires a configured database.',
    'request-failed': 'We could not send a code. Please check the phone number and try again.',
    'verify-failed': 'We could not verify the code. Please try again.'
  },
  fa: {
    'code-sent': 'کد تایید ارسال شد. در محیط توسعه، کد را در گزارش‌های سرور بررسی کنید.',
    cooldown: 'کد به‌تازگی ارسال شده است. پیش از درخواست دوباره کمی صبر کنید.',
    rate_limited: 'تعداد درخواست‌های کد بیش از حد مجاز است. بعدا دوباره تلاش کنید.',
    missing_or_expired: 'کد وجود ندارد یا منقضی شده است. کد جدیدی درخواست کنید.',
    invalid_code: 'کد واردشده درست نیست. دوباره تلاش کنید.',
    too_many_attempts: 'تعداد تلاش‌ها بیش از حد مجاز است. کد جدیدی درخواست کنید.',
    'database-required': 'ورود مشتری به پایگاه داده پیکربندی‌شده نیاز دارد.',
    'request-failed': 'نتوانستیم کد را ارسال کنیم. شماره تلفن را بررسی کنید و دوباره تلاش کنید.',
    'verify-failed': 'نتوانستیم کد را تایید کنیم. دوباره تلاش کنید.'
  }
};

function normalizeLoginStatusLocale(locale?: string | null): LoginStatusCopyLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function getLoginStatusCopy(status?: string | null, locale?: string | null): string | undefined {
  if (!status || !(status in loginStatusCopy.en)) return undefined;
  const key = status as LoginStatusCopyKey;
  const normalizedLocale = normalizeLoginStatusLocale(locale);
  return loginStatusCopy[normalizedLocale][key] ?? loginStatusCopy.en[key];
}
