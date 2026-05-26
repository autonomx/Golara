export type CustomerCopyLocale = 'en' | 'fa';

export type CustomerCopyKey =
  | 'account.eyebrow'
  | 'account.title'
  | 'account.subtitle'
  | 'account.profileTitle'
  | 'account.editProfile'
  | 'account.orderHistory'
  | 'account.signOut'
  | 'account.signInTitle'
  | 'account.signInBody'
  | 'account.signInWithPhone'
  | 'account.continueShopping'
  | 'account.savedAddresses'
  | 'account.noSavedAddresses'
  | 'account.accountsUnavailableTitle'
  | 'account.accountsUnavailableBody'
  | 'login.eyebrow'
  | 'login.title'
  | 'login.subtitle'
  | 'login.longSubtitle'
  | 'login.unavailableTitle'
  | 'login.unavailableBody'
  | 'login.requestTitle'
  | 'login.requestSafetyNote'
  | 'login.phoneLabel'
  | 'login.requestCode'
  | 'login.verifyTitle'
  | 'login.codeFor'
  | 'login.codeLabel'
  | 'login.verifyCode'
  | 'login.verifyAndSignIn'
  | 'login.requestFirst'
  | 'profile.eyebrow'
  | 'profile.title'
  | 'profile.subtitle'
  | 'profile.displayName'
  | 'profile.updateProfile'
  | 'profile.verifiedPhone'
  | 'profile.phoneDeferredNote'
  | 'profile.unavailableBody'
  | 'cart.title'
  | 'cart.emptyTitle'
  | 'cart.emptyBody'
  | 'cart.subtotal'
  | 'cart.checkout'
  | 'checkout.title'
  | 'checkout.contactDetails'
  | 'checkout.deliveryAddress'
  | 'checkout.placeOrder'
  | 'orders.title'
  | 'orders.emptyTitle'
  | 'orders.emptyBody'
  | 'orderStatus.title'
  | 'orderStatus.paid'
  | 'orderStatus.pending'
  | 'orderStatus.failed'
  | 'orderStatus.cancelled'
  | 'common.accountOverview'
  | 'common.backToCheckout'
  | 'common.name'
  | 'common.phone'
  | 'common.email'
  | 'common.locale'
  | 'common.notSet'
  | 'common.default';

type CustomerCopyRegistry = Record<CustomerCopyLocale, Record<CustomerCopyKey, string>>;

export const customerCopy: CustomerCopyRegistry = {
  en: {
    'account.eyebrow': 'Customer account',
    'account.title': 'Your Golara account',
    'account.subtitle': 'Account access connects your saved contact details, delivery addresses, and order history.',
    'account.profileTitle': 'Account profile',
    'account.editProfile': 'Edit profile',
    'account.orderHistory': 'View order history',
    'account.signOut': 'Sign out',
    'account.signInTitle': 'Sign in to continue',
    'account.signInBody': 'Use phone verification to access your order history, saved addresses, and checkout prefill.',
    'account.signInWithPhone': 'Sign in with phone',
    'account.continueShopping': 'Continue shopping',
    'account.savedAddresses': 'Saved addresses',
    'account.noSavedAddresses': 'No saved addresses yet. Checkout will add delivery addresses to your profile.',
    'account.accountsUnavailableTitle': 'Accounts unavailable',
    'account.accountsUnavailableBody': 'Customer accounts require a configured database.',
    'login.eyebrow': 'Customer login',
    'login.title': 'Sign in with phone',
    'login.subtitle': 'We will send a one-time code to verify your phone number.',
    'login.longSubtitle': 'Enter your phone number to receive a one-time verification code. This connects your account, order history, saved addresses, and checkout prefill.',
    'login.unavailableTitle': 'Login unavailable',
    'login.unavailableBody': 'Customer login requires a configured database.',
    'login.requestTitle': 'Request code',
    'login.requestSafetyNote': 'For safety, code requests have a short resend cooldown and request limit.',
    'login.phoneLabel': 'Phone number',
    'login.requestCode': 'Send verification code',
    'login.verifyTitle': 'Enter your verification code',
    'login.codeFor': 'Code for',
    'login.codeLabel': 'Verification code',
    'login.verifyCode': 'Verify code',
    'login.verifyAndSignIn': 'Verify and sign in',
    'login.requestFirst': 'Request a code first, then return here to verify it.',
    'profile.eyebrow': 'Account profile',
    'profile.title': 'Edit profile',
    'profile.subtitle': 'Update your display name, email, and locale. Verified phone changes require a separate verification flow and are not edited here.',
    'profile.displayName': 'Display name',
    'profile.updateProfile': 'Update profile',
    'profile.verifiedPhone': 'Verified phone',
    'profile.phoneDeferredNote': 'Phone changes are intentionally deferred until a separate verification flow is added.',
    'profile.unavailableBody': 'Profile editing requires a configured database.',
    'cart.title': 'Your cart',
    'cart.emptyTitle': 'Your cart is empty',
    'cart.emptyBody': 'Add arrangements to your cart before checkout.',
    'cart.subtotal': 'Subtotal',
    'cart.checkout': 'Checkout',
    'checkout.title': 'Checkout',
    'checkout.contactDetails': 'Contact details',
    'checkout.deliveryAddress': 'Delivery address',
    'checkout.placeOrder': 'Place order',
    'orders.title': 'Order history',
    'orders.emptyTitle': 'No orders yet',
    'orders.emptyBody': 'Orders placed with this phone number will appear here.',
    'orderStatus.title': 'Order status',
    'orderStatus.paid': 'Paid',
    'orderStatus.pending': 'Pending',
    'orderStatus.failed': 'Failed',
    'orderStatus.cancelled': 'Cancelled',
    'common.accountOverview': 'Account overview',
    'common.backToCheckout': 'Back to checkout',
    'common.name': 'Name',
    'common.phone': 'Phone',
    'common.email': 'Email',
    'common.locale': 'Locale',
    'common.notSet': 'Not set',
    'common.default': 'Default'
  },
  fa: {
    'account.eyebrow': 'حساب مشتری',
    'account.title': 'حساب کاربری گلارا',
    'account.subtitle': 'حساب کاربری، اطلاعات تماس، نشانی‌های ارسال و تاریخچه سفارش‌های شما را به هم متصل می‌کند.',
    'account.profileTitle': 'پروفایل حساب',
    'account.editProfile': 'ویرایش پروفایل',
    'account.orderHistory': 'مشاهده تاریخچه سفارش‌ها',
    'account.signOut': 'خروج',
    'account.signInTitle': 'برای ادامه وارد شوید',
    'account.signInBody': 'با تایید شماره تلفن، به تاریخچه سفارش‌ها، نشانی‌های ذخیره‌شده و تکمیل سریع پرداخت دسترسی پیدا می‌کنید.',
    'account.signInWithPhone': 'ورود با شماره تلفن',
    'account.continueShopping': 'ادامه خرید',
    'account.savedAddresses': 'نشانی‌های ذخیره‌شده',
    'account.noSavedAddresses': 'هنوز نشانی ذخیره‌شده‌ای ندارید. هنگام پرداخت، نشانی ارسال به پروفایل شما اضافه می‌شود.',
    'account.accountsUnavailableTitle': 'حساب‌ها در دسترس نیستند',
    'account.accountsUnavailableBody': 'حساب مشتری به پایگاه داده پیکربندی‌شده نیاز دارد.',
    'login.eyebrow': 'ورود مشتری',
    'login.title': 'ورود با شماره تلفن',
    'login.subtitle': 'برای تایید شماره تلفن، یک کد یک‌بارمصرف ارسال می‌کنیم.',
    'login.longSubtitle': 'شماره تلفن خود را وارد کنید تا کد تایید یک‌بارمصرف دریافت کنید. این ورود، حساب، تاریخچه سفارش‌ها، نشانی‌های ذخیره‌شده و تکمیل سریع پرداخت را به هم متصل می‌کند.',
    'login.unavailableTitle': 'ورود در دسترس نیست',
    'login.unavailableBody': 'ورود مشتری به پایگاه داده پیکربندی‌شده نیاز دارد.',
    'login.requestTitle': 'درخواست کد',
    'login.requestSafetyNote': 'برای امنیت بیشتر، درخواست کد شامل زمان انتظار کوتاه و محدودیت تعداد درخواست است.',
    'login.phoneLabel': 'شماره تلفن',
    'login.requestCode': 'ارسال کد تایید',
    'login.verifyTitle': 'کد تایید را وارد کنید',
    'login.codeFor': 'کد برای',
    'login.codeLabel': 'کد تایید',
    'login.verifyCode': 'تایید کد',
    'login.verifyAndSignIn': 'تایید و ورود',
    'login.requestFirst': 'ابتدا کد را درخواست کنید، سپس برای تایید آن به این بخش برگردید.',
    'profile.eyebrow': 'پروفایل حساب',
    'profile.title': 'ویرایش پروفایل',
    'profile.subtitle': 'نام نمایشی، ایمیل و زبان خود را به‌روزرسانی کنید. تغییر شماره تلفن تاییدشده به جریان تایید جداگانه نیاز دارد و اینجا ویرایش نمی‌شود.',
    'profile.displayName': 'نام نمایشی',
    'profile.updateProfile': 'به‌روزرسانی پروفایل',
    'profile.verifiedPhone': 'تلفن تاییدشده',
    'profile.phoneDeferredNote': 'تغییر شماره تلفن عمدا تا زمان اضافه‌شدن جریان تایید جداگانه به تعویق افتاده است.',
    'profile.unavailableBody': 'ویرایش پروفایل به پایگاه داده پیکربندی‌شده نیاز دارد.',
    'cart.title': 'سبد خرید شما',
    'cart.emptyTitle': 'سبد خرید شما خالی است',
    'cart.emptyBody': 'پیش از پرداخت، گل‌آرایی‌های موردنظر را به سبد خرید اضافه کنید.',
    'cart.subtotal': 'جمع جزء',
    'cart.checkout': 'پرداخت',
    'checkout.title': 'پرداخت',
    'checkout.contactDetails': 'اطلاعات تماس',
    'checkout.deliveryAddress': 'نشانی ارسال',
    'checkout.placeOrder': 'ثبت سفارش',
    'orders.title': 'تاریخچه سفارش‌ها',
    'orders.emptyTitle': 'هنوز سفارشی ثبت نشده است',
    'orders.emptyBody': 'سفارش‌هایی که با این شماره تلفن ثبت شوند، اینجا نمایش داده می‌شوند.',
    'orderStatus.title': 'وضعیت سفارش',
    'orderStatus.paid': 'پرداخت‌شده',
    'orderStatus.pending': 'در انتظار',
    'orderStatus.failed': 'ناموفق',
    'orderStatus.cancelled': 'لغوشده',
    'common.accountOverview': 'نمای کلی حساب',
    'common.backToCheckout': 'بازگشت به پرداخت',
    'common.name': 'نام',
    'common.phone': 'تلفن',
    'common.email': 'ایمیل',
    'common.locale': 'زبان',
    'common.notSet': 'تنظیم نشده',
    'common.default': 'پیش‌فرض'
  }
};

export function normalizeCustomerCopyLocale(locale?: string | null): CustomerCopyLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function getCustomerCopy(key: CustomerCopyKey, locale?: string | null): string {
  const normalizedLocale = normalizeCustomerCopyLocale(locale);
  return customerCopy[normalizedLocale][key] ?? customerCopy.en[key];
}

export function getCustomerCopyDirection(locale?: string | null): 'ltr' | 'rtl' {
  return normalizeCustomerCopyLocale(locale) === 'fa' ? 'rtl' : 'ltr';
}
