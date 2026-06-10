import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey } from '@/lib/localization/admin-copy';
import type { RecentActivitySource } from '@/lib/analytics/recent-activity-summary';

const en = {
  'Activities reviewed': 'Activities reviewed',
  Activity: 'Activity',
  Actor: 'Actor',
  Admin: 'Admin',
  Analytics: 'Analytics',
  'Recent activity timeline': 'Recent activity timeline',
  'Unified operational feed from order timeline events, customer timeline events, and admin audit logs.':
    'Unified operational feed from order timeline events, customer timeline events, and admin audit logs.',
  'No recent order, customer, or admin activity has been recorded yet.': 'No recent order, customer, or admin activity has been recorded yet.',
  Entity: 'Entity',
  Source: 'Source',
  Sources: 'Sources',
  'Staff activities': 'Staff activities',
  'System activities': 'System activities',
  'System activity': 'System activity',
  shown: 'shown',
  order: 'Order',
  customer: 'Customer',
  admin: 'Admin'
} as const;

const fa: Record<keyof typeof en, string> = {
  'Activities reviewed': 'فعالیت های بررسی شده',
  Activity: 'فعالیت',
  Actor: 'اجراکننده',
  Admin: 'مدیر',
  Analytics: 'تحلیل ها',
  'Recent activity timeline': 'خط زمانی فعالیت اخیر',
  'Unified operational feed from order timeline events, customer timeline events, and admin audit logs.':
    'جریان عملیاتی یکپارچه از رویدادهای خط زمانی سفارش، رویدادهای مشتری و گزارش های ممیزی مدیریت.',
  'No recent order, customer, or admin activity has been recorded yet.': 'هنوز فعالیت جدید سفارش، مشتری یا مدیریت ثبت نشده است.',
  Entity: 'موجودیت',
  Source: 'منبع',
  Sources: 'منابع',
  'Staff activities': 'فعالیت های تیم',
  'System activities': 'فعالیت های سیستم',
  'System activity': 'فعالیت سیستم',
  shown: 'نمایش داده شده',
  order: 'سفارش',
  customer: 'مشتری',
  admin: 'مدیریت'
};

export function getAdminRecentActivityCopy(key: string, locale?: SupportedLocale | string | null) {
  if (adminLocaleKey(locale) === 'fa' && key in fa) return fa[key as keyof typeof fa];
  if (key in en) return en[key as keyof typeof en];
  return key;
}

export function createAdminRecentActivityTranslator(locale?: SupportedLocale | string | null) {
  return (key: string) => getAdminRecentActivityCopy(key, locale);
}

export function translateRecentActivitySource(source: RecentActivitySource, locale?: SupportedLocale | string | null) {
  return getAdminRecentActivityCopy(source, locale);
}
