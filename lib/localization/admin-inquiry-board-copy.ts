import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey } from '@/lib/localization/admin-copy';

const en = {
  All: 'All',
  'Assignment exports': 'Assignment exports',
  'Assignment filter': 'Assignment filter',
  'Assign to me': 'Assign to me',
  'Assign to owner queue': 'Assign to owner queue',
  'Assign to staff queue': 'Assign to staff queue',
  Assigned: 'Assigned',
  Channel: 'Channel',
  Delivery: 'Delivery',
  'Delivery notes': 'Delivery notes',
  'Export CSV': 'Export CSV',
  'Follow-up history': 'Follow-up history',
  'Follow-up note': 'Follow-up note',
  'General inquiry': 'General inquiry',
  'Mark cancelled': 'Mark cancelled',
  'Mark confirmed': 'Mark confirmed',
  'Mark contacted': 'Mark contacted',
  'Mark fulfilled': 'Mark fulfilled',
  'Mark new': 'Mark new',
  'No follow-ups recorded yet.': 'No follow-ups recorded yet.',
  'Owner queue': 'Owner queue',
  'Print view': 'Print view',
  'Save inquiry': 'Save inquiry',
  'Search name, phone, email, notes, product...': 'Search name, phone, email, notes, product...',
  'Staff queue': 'Staff queue',
  'Staff notes': 'Staff notes',
  Unassign: 'Unassign'
} as const;

const fa: Record<keyof typeof en, string> = {
  All: 'همه',
  'Assignment exports': 'خروجی های تخصیص',
  'Assignment filter': 'فیلتر تخصیص',
  'Assign to me': 'تخصیص به من',
  'Assign to owner queue': 'تخصیص به صف مالک',
  'Assign to staff queue': 'تخصیص به صف تیم',
  Assigned: 'تخصیص داده شده',
  Channel: 'کانال',
  Delivery: 'تحویل',
  'Delivery notes': 'یادداشت های تحویل',
  'Export CSV': 'خروجی CSV',
  'Follow-up history': 'تاریخچه پیگیری',
  'Follow-up note': 'یادداشت پیگیری',
  'General inquiry': 'درخواست عمومی',
  'Mark cancelled': 'علامت گذاری به عنوان لغو شده',
  'Mark confirmed': 'علامت گذاری به عنوان تایید شده',
  'Mark contacted': 'علامت گذاری به عنوان تماس گرفته شده',
  'Mark fulfilled': 'علامت گذاری به عنوان انجام شده',
  'Mark new': 'علامت گذاری به عنوان جدید',
  'No follow-ups recorded yet.': 'هنوز پیگیری ثبت نشده است.',
  'Owner queue': 'صف مالک',
  'Print view': 'نمای چاپ',
  'Save inquiry': 'ذخیره درخواست',
  'Search name, phone, email, notes, product...': 'جستجوی نام، تلفن، ایمیل، یادداشت، محصول...',
  'Staff queue': 'صف تیم',
  'Staff notes': 'یادداشت تیم',
  Unassign: 'لغو تخصیص'
};

export type AdminInquiryBoardCopyKey = keyof typeof en;

export function inquiryStatusShortcutCopyKey(status: string) {
  return `Mark ${status}`;
}

export function getAdminInquiryBoardCopy(key: string, locale?: SupportedLocale | string | null) {
  if (adminLocaleKey(locale) === 'fa' && key in fa) return fa[key as AdminInquiryBoardCopyKey];
  if (key in en) return en[key as AdminInquiryBoardCopyKey];
  return key;
}

export function createAdminInquiryBoardTranslator(locale?: SupportedLocale | string | null) {
  return (key: string) => getAdminInquiryBoardCopy(key, locale);
}
