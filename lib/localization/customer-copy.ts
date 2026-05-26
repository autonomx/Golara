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
  | 'cart.eyebrow'
  | 'cart.title'
  | 'cart.subtitle'
  | 'cart.emptyTitle'
  | 'cart.emptyBody'
  | 'cart.unavailableTitle'
  | 'cart.unavailableBody'
  | 'cart.shopProducts'
  | 'cart.each'
  | 'cart.quantity'
  | 'cart.update'
  | 'cart.remove'
  | 'cart.summary'
  | 'cart.total'
  | 'cart.items'
  | 'cart.subtotal'
  | 'cart.finalTotalsNote'
  | 'cart.checkout'
  | 'cart.clear'
  | 'checkout.eyebrow'
  | 'checkout.title'
  | 'checkout.subtitle'
  | 'checkout.backToCart'
  | 'checkout.prefillNotice'
  | 'checkout.prefillWithAddressNotice'
  | 'checkout.unavailableTitle'
  | 'checkout.unavailableBody'
  | 'checkout.contactDetails'
  | 'checkout.deliveryAddress'
  | 'checkout.recipientDetails'
  | 'checkout.recipientName'
  | 'checkout.emailOptional'
  | 'checkout.city'
  | 'checkout.addressLine1'
  | 'checkout.addressLine2Optional'
  | 'checkout.deliveryDateOptional'
  | 'checkout.deliveryWindowOptional'
  | 'checkout.deliveryWindowPlaceholder'
  | 'checkout.deliveryNotesOptional'
  | 'checkout.customerNoteOptional'
  | 'checkout.placeOrder'
  | 'checkout.createOrderAndPay'
  | 'checkout.orderSummary'
  | 'checkout.finalizedNote'
  | 'checkout.manageAddresses'
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
  | 'common.continueShopping'
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
    'cart.eyebrow': 'Cart',
    'cart.title': 'Your flower cart',
    'cart.subtitle': 'Review quantities before moving into checkout. Totals are recomputed on the server before payment.',
    'cart.emptyTitle': 'Your cart is empty',
    'cart.emptyBody': 'Browse the catalog and add arrangements before checkout.',
    'cart.unavailableTitle': 'Cart unavailable',
    'cart.unavailableBody': 'Cart checkout requires a configured database because cart sessions are persisted server-side.',
    'cart.shopProducts': 'Shop products',
    'cart.each': 'each',
    'cart.quantity': 'Qty',
    'cart.update': 'Update',
    'cart.remove': 'Remove',
    'cart.summary': 'Summary',
    'cart.total': 'Cart total',
    'cart.items': 'Items',
    'cart.subtotal': 'Subtotal',
    'cart.finalTotalsNote': 'Delivery, discounts, and final totals are recomputed during checkout.',
    'cart.checkout': 'Continue to checkout',
    'cart.clear': 'Clear cart',
    'checkout.eyebrow': 'Cart checkout',
    'checkout.title': 'Delivery and payment',
    'checkout.subtitle': 'Confirm delivery details. Final totals are recomputed on the server before the payment handoff.',
    'checkout.backToCart': 'Back to cart',
    'checkout.prefillNotice': 'Checkout details were prefilled from your signed-in account.',
    'checkout.prefillWithAddressNotice': 'Checkout details were prefilled from your signed-in account and default saved address.',
    'checkout.unavailableTitle': 'Checkout unavailable',
    'checkout.unavailableBody': 'Cart checkout requires a configured database.',
    'checkout.contactDetails': 'Contact details',
    'checkout.deliveryAddress': 'Delivery address',
    'checkout.recipientDetails': 'Recipient details',
    'checkout.recipientName': 'Recipient name',
    'checkout.emailOptional': 'Email optional',
    'checkout.city': 'City',
    'checkout.addressLine1': 'Address line 1',
    'checkout.addressLine2Optional': 'Address line 2 optional',
    'checkout.deliveryDateOptional': 'Delivery date optional',
    'checkout.deliveryWindowOptional': 'Delivery window optional',
    'checkout.deliveryWindowPlaceholder': 'Morning, afternoon, evening',
    'checkout.deliveryNotesOptional': 'Delivery notes optional',
    'checkout.customerNoteOptional': 'Customer note optional',
    'checkout.placeOrder': 'Place order',
    'checkout.createOrderAndPay': 'Create order and continue to payment',
    'checkout.orderSummary': 'Order summary',
    'checkout.finalizedNote': 'Delivery, discounts, and payment state are finalized when the order is created.',
    'checkout.manageAddresses': 'Manage saved addresses',
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
    'common.continueShopping': 'Continue shopping',
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
    'cart.eyebrow': 'سبد خرید',
    'cart.title': 'سبد گل‌های شما',
    'cart.subtitle': 'پیش از پرداخت، تعداد اقلام را بررسی کنید. جمع‌ها پیش از پرداخت روی سرور دوباره محاسبه می‌شوند.',
    'cart.emptyTitle': 'سبد خرید شما خالی است',
    'cart.emptyBody': 'کاتالوگ را مرور کنید و پیش از پرداخت، گل‌آرایی‌های موردنظر را اضافه کنید.',
    'cart.unavailableTitle': 'سبد خرید در دسترس نیست',
    'cart.unavailableBody': 'پرداخت سبد خرید به پایگاه داده پیکربندی‌شده نیاز دارد، چون نشست‌های سبد خرید روی سرور ذخیره می‌شوند.',
    'cart.shopProducts': 'مشاهده محصولات',
    'cart.each': 'هر عدد',
    'cart.quantity': 'تعداد',
    'cart.update': 'به‌روزرسانی',
    'cart.remove': 'حذف',
    'cart.summary': 'خلاصه',
    'cart.total': 'جمع سبد خرید',
    'cart.items': 'اقلام',
    'cart.subtotal': 'جمع جزء',
    'cart.finalTotalsNote': 'هزینه ارسال، تخفیف‌ها و جمع نهایی هنگام پرداخت دوباره محاسبه می‌شوند.',
    'cart.checkout': 'ادامه به پرداخت',
    'cart.clear': 'خالی کردن سبد',
    'checkout.eyebrow': 'پرداخت سبد خرید',
    'checkout.title': 'ارسال و پرداخت',
    'checkout.subtitle': 'اطلاعات ارسال را تایید کنید. جمع نهایی پیش از انتقال به پرداخت روی سرور دوباره محاسبه می‌شود.',
    'checkout.backToCart': 'بازگشت به سبد خرید',
    'checkout.prefillNotice': 'اطلاعات پرداخت از حساب واردشده شما تکمیل شد.',
    'checkout.prefillWithAddressNotice': 'اطلاعات پرداخت از حساب واردشده و نشانی پیش‌فرض ذخیره‌شده شما تکمیل شد.',
    'checkout.unavailableTitle': 'پرداخت در دسترس نیست',
    'checkout.unavailableBody': 'پرداخت سبد خرید به پایگاه داده پیکربندی‌شده نیاز دارد.',
    'checkout.contactDetails': 'اطلاعات تماس',
    'checkout.deliveryAddress': 'نشانی ارسال',
    'checkout.recipientDetails': 'اطلاعات گیرنده',
    'checkout.recipientName': 'نام گیرنده',
    'checkout.emailOptional': 'ایمیل اختیاری',
    'checkout.city': 'شهر',
    'checkout.addressLine1': 'خط اول نشانی',
    'checkout.addressLine2Optional': 'خط دوم نشانی اختیاری',
    'checkout.deliveryDateOptional': 'تاریخ ارسال اختیاری',
    'checkout.deliveryWindowOptional': 'بازه ارسال اختیاری',
    'checkout.deliveryWindowPlaceholder': 'صبح، بعدازظهر، عصر',
    'checkout.deliveryNotesOptional': 'یادداشت ارسال اختیاری',
    'checkout.customerNoteOptional': 'یادداشت مشتری اختیاری',
    'checkout.placeOrder': 'ثبت سفارش',
    'checkout.createOrderAndPay': 'ثبت سفارش و ادامه به پرداخت',
    'checkout.orderSummary': 'خلاصه سفارش',
    'checkout.finalizedNote': 'ارسال، تخفیف‌ها و وضعیت پرداخت هنگام ایجاد سفارش نهایی می‌شوند.',
    'checkout.manageAddresses': 'مدیریت نشانی‌های ذخیره‌شده',
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
    'common.continueShopping': 'ادامه خرید',
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
