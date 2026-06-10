import Link from 'next/link';
import type { AdminCustomerListItem } from '@/lib/customers/customer-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Customers',
    title: 'Customer profiles',
    body: 'Review customer account records, addresses, and linked order counts before the full customer detail workflow is added.',
    profiles: 'profiles',
    databaseRequired: 'Customer admin requires a configured database.',
    empty: 'No customer profiles yet.',
    customer: 'Customer',
    phone: 'Phone',
    locale: 'Locale',
    orders: 'Orders',
    addresses: 'Addresses',
    lastLogin: 'Last login',
    updated: 'Updated',
    unnamed: 'Unnamed customer',
    noEmail: 'No email',
    never: 'Never',
    persian: 'Persian',
    english: 'English',
    unknownLocale: 'Unknown locale',
    noPhone: 'No phone'
  },
  fa: {
    eyebrow: 'مشتریان',
    title: 'پروفایل‌های مشتری',
    body: 'سوابق حساب مشتری، آدرس‌ها و تعداد سفارش‌های مرتبط را بررسی کنید.',
    profiles: 'پروفایل',
    databaseRequired: 'مدیریت مشتری به پایگاه داده پیکربندی‌شده نیاز دارد.',
    empty: 'هنوز هیچ پروفایل مشتری ثبت نشده است.',
    customer: 'مشتری',
    phone: 'تلفن',
    locale: 'زبان',
    orders: 'سفارش‌ها',
    addresses: 'آدرس‌ها',
    lastLogin: 'آخرین ورود',
    updated: 'به‌روزرسانی',
    unnamed: 'مشتری بدون نام',
    noEmail: 'بدون ایمیل',
    never: 'هرگز',
    persian: 'فارسی',
    english: 'انگلیسی',
    unknownLocale: 'زبان نامشخص',
    noPhone: 'بدون تلفن'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function formatDate(value: Date | null | undefined, locale: SupportedLocale | string | null | undefined, neverLabel: string) {
  if (!value) return neverLabel;
  return new Intl.DateTimeFormat(localeKey(locale) === 'fa' ? 'fa-IR' : 'en-CA', { dateStyle: 'medium' }).format(value);
}

function formatCustomerLocale(value: string | null | undefined, labels: typeof copy.en | typeof copy.fa) {
  const normalized = value?.toLowerCase() ?? '';
  if (normalized.startsWith('fa')) return labels.persian;
  if (normalized.startsWith('en')) return labels.english;
  return labels.unknownLocale;
}

export async function AdminCustomerPanel({ customers, databaseReady, locale }: { customers: AdminCustomerListItem[]; databaseReady: boolean; locale?: SupportedLocale | string | null }) {
  const activeLocale = locale ?? await resolveStorefrontLocale();
  const labels = copy[localeKey(activeLocale)];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            {labels.body}
          </p>
        </div>
        <span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">
          {customers.length} {labels.profiles}
        </span>
      </div>

      {!databaseReady ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {labels.databaseRequired}
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-6 rounded-md border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
          {labels.empty}
        </div>
      ) : (
        <div className="mt-6 overflow-auto rounded-lg border border-stone-200">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-4 py-3">{labels.customer}</th>
                <th className="px-4 py-3">{labels.phone}</th>
                <th className="px-4 py-3">{labels.locale}</th>
                <th className="px-4 py-3">{labels.orders}</th>
                <th className="px-4 py-3">{labels.addresses}</th>
                <th className="px-4 py-3">{labels.lastLogin}</th>
                <th className="px-4 py-3">{labels.updated}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-stone-200 align-top">
                  <td className="px-4 py-4">
                    <Link href={`/admin/customers/${customer.id}`} className="font-semibold text-stone-950 underline-offset-4 hover:underline">
                      {customer.displayName || labels.unnamed}
                    </Link>
                    <div className="mt-1 text-xs text-stone-500">{customer.email || labels.noEmail}</div>
                  </td>
                  <td className="px-4 py-4 text-stone-700">{customer.phone || labels.noPhone}</td>
                  <td className="px-4 py-4 text-stone-700">{formatCustomerLocale(customer.locale, labels)}</td>
                  <td className="px-4 py-4 text-stone-700">{customer.orderCount}</td>
                  <td className="px-4 py-4 text-stone-700">{customer.addressCount}</td>
                  <td className="px-4 py-4 text-stone-700">{formatDate(customer.lastLoginAt, activeLocale, labels.never)}</td>
                  <td className="px-4 py-4 text-stone-700">{formatDate(customer.updatedAt, activeLocale, labels.never)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
