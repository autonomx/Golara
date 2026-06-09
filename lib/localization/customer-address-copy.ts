export type AddressBookCopyLocale = 'en' | 'fa';

export type AddressBookCopyKey =
  | 'eyebrow'
  | 'title'
  | 'subtitle'
  | 'unavailable'
  | 'accountOverview'
  | 'addTitle'
  | 'label'
  | 'recipient'
  | 'phone'
  | 'city'
  | 'line1'
  | 'line2'
  | 'notes'
  | 'useDefault'
  | 'save'
  | 'empty'
  | 'defaultBadge'
  | 'makeDefault'
  | 'delete'
  | 'update'
  | 'cityNotSet'
  | 'status.added'
  | 'status.updated'
  | 'status.defaultUpdated'
  | 'status.deleted'
  | 'status.databaseRequired'
  | 'status.failed';

type AddressBookCopyRegistry = Record<AddressBookCopyLocale, Record<AddressBookCopyKey, string>>;

const addressBookCopy: AddressBookCopyRegistry = {
  en: {
    eyebrow: 'Saved addresses',
    title: 'Address book',
    subtitle: 'Manage delivery addresses connected to your signed-in customer profile.',
    unavailable: 'Address management requires a configured database.',
    accountOverview: 'Account overview',
    addTitle: 'Add address',
    label: 'Label',
    recipient: 'Recipient',
    phone: 'Phone',
    city: 'City',
    line1: 'Address line 1',
    line2: 'Address line 2',
    notes: 'Notes',
    useDefault: 'Use as default address',
    save: 'Save address',
    empty: 'No saved addresses yet.',
    defaultBadge: 'Default',
    makeDefault: 'Make default',
    delete: 'Delete',
    update: 'Update address',
    cityNotSet: 'City not set',
    'status.added': 'Address added.',
    'status.updated': 'Address updated.',
    'status.defaultUpdated': 'Default address updated.',
    'status.deleted': 'Address deleted.',
    'status.databaseRequired': 'Address management requires a configured database.',
    'status.failed': 'We could not update addresses. Please try again.'
  },
  fa: {
    eyebrow: 'نشانی‌های ذخیره‌شده',
    title: 'دفترچه نشانی',
    subtitle: 'نشانی‌های ارسال متصل به پروفایل مشتری واردشده خود را مدیریت کنید.',
    unavailable: 'مدیریت نشانی‌ها به پایگاه داده پیکربندی‌شده نیاز دارد.',
    accountOverview: 'نمای کلی حساب',
    addTitle: 'افزودن نشانی',
    label: 'برچسب',
    recipient: 'گیرنده',
    phone: 'تلفن',
    city: 'شهر',
    line1: 'خط اول نشانی',
    line2: 'خط دوم نشانی',
    notes: 'یادداشت‌ها',
    useDefault: 'استفاده به عنوان نشانی پیش‌فرض',
    save: 'ذخیره نشانی',
    empty: 'هنوز نشانی ذخیره‌شده‌ای ندارید.',
    defaultBadge: 'پیش‌فرض',
    makeDefault: 'انتخاب به عنوان پیش‌فرض',
    delete: 'حذف',
    update: 'به‌روزرسانی نشانی',
    cityNotSet: 'شهر تنظیم نشده',
    'status.added': 'نشانی اضافه شد.',
    'status.updated': 'نشانی به‌روزرسانی شد.',
    'status.defaultUpdated': 'نشانی پیش‌فرض به‌روزرسانی شد.',
    'status.deleted': 'نشانی حذف شد.',
    'status.databaseRequired': 'مدیریت نشانی‌ها به پایگاه داده پیکربندی‌شده نیاز دارد.',
    'status.failed': 'نتوانستیم نشانی‌ها را به‌روزرسانی کنیم. دوباره تلاش کنید.'
  }
};

function normalizeAddressBookLocale(locale?: string | null): AddressBookCopyLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function getAddressBookCopy(key: AddressBookCopyKey, locale?: string | null): string {
  const normalizedLocale = normalizeAddressBookLocale(locale);
  return addressBookCopy[normalizedLocale][key] ?? addressBookCopy.en[key];
}

export function getAddressBookStatusCopy(status?: string | null, locale?: string | null): string | undefined {
  if (status === 'added') return getAddressBookCopy('status.added', locale);
  if (status === 'updated') return getAddressBookCopy('status.updated', locale);
  if (status === 'default-updated') return getAddressBookCopy('status.defaultUpdated', locale);
  if (status === 'deleted') return getAddressBookCopy('status.deleted', locale);
  if (status === 'database-required') return getAddressBookCopy('status.databaseRequired', locale);
  if (status === 'failed') return getAddressBookCopy('status.failed', locale);
  return undefined;
}
