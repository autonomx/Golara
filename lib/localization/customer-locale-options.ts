import { normalizeCustomerCopyLocale, type CustomerCopyLocale } from '@/lib/localization/customer-copy';

export type CustomerLocaleOptionValue = 'fa-IR' | 'en-CA';

const customerLocaleOptionLabels: Record<CustomerCopyLocale, Record<CustomerLocaleOptionValue, string>> = {
  en: {
    'fa-IR': 'Persian / Iran',
    'en-CA': 'English / Canada'
  },
  fa: {
    'fa-IR': 'فارسی / ایران',
    'en-CA': 'انگلیسی / کانادا'
  }
};

export function getCustomerLocaleOptionLabel(value: CustomerLocaleOptionValue, locale?: string | null): string {
  return customerLocaleOptionLabels[normalizeCustomerCopyLocale(locale)][value] ?? customerLocaleOptionLabels.en[value];
}
