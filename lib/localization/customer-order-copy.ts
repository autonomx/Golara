export type CustomerOrderCopyLocale = 'en' | 'fa';

export type CustomerOrderCopyKey =
  | 'eyebrow'
  | 'title'
  | 'subtitle'
  | 'unavailableTitle'
  | 'unavailableBody'
  | 'accountOverview'
  | 'emptyTitle'
  | 'emptyBody'
  | 'browseProducts'
  | 'viewPublicStatus'
  | 'itemSingular'
  | 'itemPlural'
  | 'moreItemSingular'
  | 'moreItemPlural'
  | 'payment.none'
  | 'payment.verifiedPaid'
  | 'payment.redirectRequired'
  | 'payment.manualPending'
  | 'payment.failed'
  | 'payment.cancelled';

export type CustomerOrderMethodConfirmationKey =
  | 'gateway'
  | 'wallet'
  | 'manualTransfer'
  | 'installment'
  | 'cod';

export type CustomerOrderMethodConfirmation = {
  key: CustomerOrderMethodConfirmationKey;
  title: string;
  body: string;
  methodLabel?: string;
};

export type CustomerOrderManualTransferInstructions = {
  title: string;
  body: string;
  referenceLabel: string;
  proofUrlLabel: string;
  noEvidenceLabel: string;
  reference?: string;
  proofUrl?: string;
  emailSubject: string;
  emailBody: string;
};

export type CustomerOrderCodCollectionReminder = {
  title: string;
  body: string;
  statusLabel: string;
  settlementLabel: string;
  settlementReferenceLabel: string;
  noSettlementReferenceLabel: string;
  collectionStatus: string;
  settlementStatus?: string;
  settlementReference?: string;
  emailSubject: string;
  emailBody: string;
};

type CustomerOrderCopyRegistry = Record<CustomerOrderCopyLocale, Record<CustomerOrderCopyKey, string>>;
type CustomerOrderMethodConfirmationRegistry = Record<CustomerOrderCopyLocale, Record<CustomerOrderMethodConfirmationKey, { title: string; body: string }>>;
type CustomerOrderManualTransferInstructionRegistry = Record<CustomerOrderCopyLocale, {
  title: string;
  body: string;
  referenceLabel: string;
  proofUrlLabel: string;
  noEvidenceLabel: string;
  emailSubject: string;
  emailBodyIntro: string;
  emailEvidenceIntro: string;
}>;
type CustomerOrderCodCollectionReminderRegistry = Record<CustomerOrderCopyLocale, {
  title: string;
  body: string;
  statusLabel: string;
  settlementLabel: string;
  settlementReferenceLabel: string;
  noSettlementReferenceLabel: string;
  emailSubject: string;
  emailBodyIntro: string;
  emailEvidenceIntro: string;
  statusLabels: Record<string, string>;
  settlementStatusLabels: Record<string, string>;
}>;

const customerOrderCopy: CustomerOrderCopyRegistry = {
  en: {
    eyebrow: 'Order history',
    title: 'Your orders',
    subtitle: 'Review orders connected to your signed-in customer profile. Public order pages still use privacy-safe lookup tokens.',
    unavailableTitle: 'Order history unavailable',
    unavailableBody: 'Customer order history requires a configured database.',
    accountOverview: 'Account overview',
    emptyTitle: 'No orders yet.',
    emptyBody: 'Orders created while signed in will appear here.',
    browseProducts: 'Browse products',
    viewPublicStatus: 'View public status',
    itemSingular: 'item',
    itemPlural: 'items',
    moreItemSingular: 'more item',
    moreItemPlural: 'more items',
    'payment.none': 'No payment attempt yet',
    'payment.verifiedPaid': 'Payment verified',
    'payment.redirectRequired': 'Waiting for gateway payment',
    'payment.manualPending': 'Manual follow-up pending',
    'payment.failed': 'Payment failed',
    'payment.cancelled': 'Payment cancelled'
  },
  fa: {
    eyebrow: 'تاریخچه سفارش‌ها',
    title: 'سفارش‌های شما',
    subtitle: 'سفارش‌های متصل به پروفایل مشتری واردشده خود را مرور کنید. صفحه‌های عمومی سفارش همچنان از شناسه‌های امن و خصوصی استفاده می‌کنند.',
    unavailableTitle: 'تاریخچه سفارش‌ها در دسترس نیست',
    unavailableBody: 'تاریخچه سفارش‌های مشتری به پایگاه داده پیکربندی‌شده نیاز دارد.',
    accountOverview: 'نمای کلی حساب',
    emptyTitle: 'هنوز سفارشی ندارید.',
    emptyBody: 'سفارش‌هایی که هنگام ورود ایجاد شوند، اینجا نمایش داده می‌شوند.',
    browseProducts: 'مشاهده محصولات',
    viewPublicStatus: 'مشاهده وضعیت عمومی',
    itemSingular: 'قلم',
    itemPlural: 'قلم',
    moreItemSingular: 'قلم دیگر',
    moreItemPlural: 'قلم دیگر',
    'payment.none': 'هنوز تلاش پرداختی ثبت نشده است',
    'payment.verifiedPaid': 'پرداخت تایید شد',
    'payment.redirectRequired': 'در انتظار پرداخت در درگاه',
    'payment.manualPending': 'پیگیری دستی در انتظار است',
    'payment.failed': 'پرداخت ناموفق بود',
    'payment.cancelled': 'پرداخت لغو شد'
  }
};

const customerOrderMethodConfirmationCopy: CustomerOrderMethodConfirmationRegistry = {
  en: {
    gateway: {
      title: 'Online payment selected',
      body: 'Your order is linked to an online gateway payment. We will update the order as soon as provider confirmation is recorded.'
    },
    wallet: {
      title: 'Wallet payment selected',
      body: 'Your order uses your wallet balance. Balance reservation, capture, and later adjustments are shown in your wallet history.'
    },
    manualTransfer: {
      title: 'Manual transfer selected',
      body: 'Keep your bank transfer reference or proof link available. Staff will review the transfer evidence before marking payment complete.'
    },
    installment: {
      title: 'Installment request selected',
      body: 'Your order uses the installment review lane. We will show approval status, follow-up requests, and schedule details here.'
    },
    cod: {
      title: 'Pay on delivery selected',
      body: 'Please keep the delivery amount ready for collection. Staff collection status, settlement evidence, and any follow-up reminders stay attached to this order.'
    }
  },
  fa: {
    gateway: {
      title: 'پرداخت آنلاین انتخاب شده است',
      body: 'این سفارش به پرداخت آنلاین درگاه متصل است. پس از ثبت تایید ارائه‌دهنده، وضعیت سفارش به‌روزرسانی می‌شود.'
    },
    wallet: {
      title: 'پرداخت با کیف پول انتخاب شده است',
      body: 'این سفارش از موجودی کیف پول شما استفاده می‌کند. رزرو، برداشت و اصلاحات بعدی در تاریخچه کیف پول نمایش داده می‌شود.'
    },
    manualTransfer: {
      title: 'انتقال بانکی انتخاب شده است',
      body: 'شناسه انتقال یا لینک رسید را نگه دارید. تیم پشتیبانی رسید انتقال را پیش از تکمیل پرداخت بررسی می‌کند.'
    },
    installment: {
      title: 'خرید اقساطی انتخاب شده است',
      body: 'این سفارش از مسیر بررسی اقساط استفاده می‌کند. وضعیت تایید، درخواست پیگیری و برنامه پرداخت در اینجا نمایش داده می‌شود.'
    },
    cod: {
      title: 'پرداخت هنگام تحویل انتخاب شده است',
      body: 'لطفاً مبلغ سفارش را هنگام تحویل آماده نگه دارید. وضعیت دریافت، شواهد تسویه و یادآوری‌های پیگیری همراه سفارش ثبت می‌شود.'
    }
  }
};

const manualTransferInstructionCopy: CustomerOrderManualTransferInstructionRegistry = {
  en: {
    title: 'Manual-transfer instructions',
    body: 'If you have already sent the transfer, keep the reference and receipt link below. If you have not paid yet, our team will use these same instructions when contacting you by email.',
    referenceLabel: 'Tracking/reference number',
    proofUrlLabel: 'Receipt or proof link',
    noEvidenceLabel: 'No transfer evidence has been attached yet.',
    emailSubject: 'Manual-transfer instructions for order {{orderNumber}}',
    emailBodyIntro: 'Your order uses manual transfer. Please keep your tracking/reference number and receipt link available until staff review is complete.',
    emailEvidenceIntro: 'Evidence recorded for this order:'
  },
  fa: {
    title: 'راهنمای انتقال بانکی',
    body: 'اگر انتقال را انجام داده‌اید، شناسه پیگیری و لینک رسید زیر را نگه دارید. اگر هنوز پرداخت نکرده‌اید، تیم ما همین راهنما را هنگام تماس ایمیلی برای شما ارسال می‌کند.',
    referenceLabel: 'شماره پیگیری پرداخت',
    proofUrlLabel: 'لینک رسید یا مدرک پرداخت',
    noEvidenceLabel: 'هنوز مدرک انتقالی برای این سفارش ثبت نشده است.',
    emailSubject: 'راهنمای انتقال بانکی سفارش {{orderNumber}}',
    emailBodyIntro: 'این سفارش از روش انتقال بانکی استفاده می‌کند. لطفاً شماره پیگیری و لینک رسید را تا پایان بررسی تیم پشتیبانی نگه دارید.',
    emailEvidenceIntro: 'مدارک ثبت‌شده برای این سفارش:'
  }
};

const codCollectionReminderCopy: CustomerOrderCodCollectionReminderRegistry = {
  en: {
    title: 'Cash-on-delivery reminder',
    body: 'Please keep the delivery payment ready. We will update this order when staff record collection or a waiver at delivery.',
    statusLabel: 'Collection status',
    settlementLabel: 'Settlement status',
    settlementReferenceLabel: 'Settlement reference',
    noSettlementReferenceLabel: 'No settlement reference has been recorded yet.',
    emailSubject: 'Cash-on-delivery reminder for order {{orderNumber}}',
    emailBodyIntro: 'Your order uses cash on delivery. Please keep the collection amount ready for the delivery team.',
    emailEvidenceIntro: 'Current COD collection evidence:',
    statusLabels: {
      pending: 'Pending collection',
      collected: 'Collected at delivery',
      failed: 'Collection needs follow-up',
      waived: 'Collection waived'
    },
    settlementStatusLabels: {
      pending: 'Settlement pending',
      collected: 'Settlement collected',
      failed: 'Settlement failed',
      waived: 'Settlement waived',
      settled: 'Settlement completed'
    }
  },
  fa: {
    title: 'یادآوری پرداخت هنگام تحویل',
    body: 'لطفاً مبلغ پرداخت هنگام تحویل را آماده نگه دارید. پس از ثبت دریافت یا معافیت توسط کارکنان، وضعیت این سفارش به‌روزرسانی می‌شود.',
    statusLabel: 'وضعیت دریافت',
    settlementLabel: 'وضعیت تسویه',
    settlementReferenceLabel: 'شناسه تسویه',
    noSettlementReferenceLabel: 'هنوز شناسه تسویه‌ای برای این سفارش ثبت نشده است.',
    emailSubject: 'یادآوری پرداخت هنگام تحویل سفارش {{orderNumber}}',
    emailBodyIntro: 'این سفارش با پرداخت هنگام تحویل ثبت شده است. لطفاً مبلغ دریافت را برای تیم تحویل آماده نگه دارید.',
    emailEvidenceIntro: 'شواهد فعلی دریافت COD:',
    statusLabels: {
      pending: 'در انتظار دریافت',
      collected: 'هنگام تحویل دریافت شد',
      failed: 'دریافت نیازمند پیگیری است',
      waived: 'دریافت معاف شد'
    },
    settlementStatusLabels: {
      pending: 'تسویه در انتظار است',
      collected: 'تسویه دریافت شد',
      failed: 'تسویه ناموفق بود',
      waived: 'تسویه معاف شد',
      settled: 'تسویه تکمیل شد'
    }
  }
};

export function normalizeCustomerOrderCopyLocale(locale?: string | null): CustomerOrderCopyLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function getCustomerOrderCopy(key: CustomerOrderCopyKey, locale?: string | null): string {
  const normalizedLocale = normalizeCustomerOrderCopyLocale(locale);
  return customerOrderCopy[normalizedLocale][key] ?? customerOrderCopy.en[key];
}

export function getCustomerOrderMethodConfirmationCopy(key: CustomerOrderMethodConfirmationKey, locale?: string | null) {
  const normalizedLocale = normalizeCustomerOrderCopyLocale(locale);
  return customerOrderMethodConfirmationCopy[normalizedLocale][key] ?? customerOrderMethodConfirmationCopy.en[key];
}

function metadataText(value: unknown) {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function normalizedMetadataMethodKey(metadata: Record<string, unknown>) {
  return metadataText(metadata.paymentMethodKey)?.toLowerCase();
}

function normalizedMetadataMethodType(metadata: Record<string, unknown>) {
  return metadataText(metadata.paymentMethodType)?.toLowerCase();
}

function isManualTransferMethod(metadata: Record<string, unknown>) {
  return normalizedMetadataMethodType(metadata) === 'manual_transfer' || normalizedMetadataMethodKey(metadata) === 'bank-transfer';
}

function isCodMethod(metadata: Record<string, unknown>) {
  return normalizedMetadataMethodType(metadata) === 'cod' || normalizedMetadataMethodKey(metadata) === 'cash-on-delivery' || metadata.codPaymentSelected === true || metadata.codRequiresDeliveryCollection === true;
}

export function customerOrderMethodConfirmation(
  metadata?: Record<string, unknown> | null,
  locale?: string | null
): CustomerOrderMethodConfirmation | null {
  if (!metadata) return null;

  const methodType = normalizedMetadataMethodType(metadata);
  const methodKey = normalizedMetadataMethodKey(metadata);
  const methodLabel = metadataText(metadata.paymentMethodLabel);
  let key: CustomerOrderMethodConfirmationKey | undefined;

  if (methodType === 'gateway' || methodKey === 'iranian-ipg') key = 'gateway';
  else if (methodType === 'wallet' || methodKey === 'wallet-credit') key = 'wallet';
  else if (methodType === 'manual_transfer' || methodKey === 'bank-transfer') key = 'manualTransfer';
  else if (methodType === 'installment' || methodKey === 'installment-credit') key = 'installment';
  else if (methodType === 'cod' || methodKey === 'cash-on-delivery') key = 'cod';

  if (!key) return null;

  return {
    key,
    methodLabel,
    ...getCustomerOrderMethodConfirmationCopy(key, locale)
  };
}

export function customerOrderManualTransferInstructions(
  metadata?: Record<string, unknown> | null,
  orderNumber = '',
  locale?: string | null
): CustomerOrderManualTransferInstructions | null {
  if (!metadata || !isManualTransferMethod(metadata)) return null;

  const normalizedLocale = normalizeCustomerOrderCopyLocale(locale);
  const copy = manualTransferInstructionCopy[normalizedLocale];
  const reference = metadataText(metadata.manualPaymentReference);
  const proofUrl = metadataText(metadata.manualPaymentProofUrl);
  const emailSubject = copy.emailSubject.replace('{{orderNumber}}', orderNumber || '—');
  const evidenceLines = [
    reference ? `${copy.referenceLabel}: ${reference}` : undefined,
    proofUrl ? `${copy.proofUrlLabel}: ${proofUrl}` : undefined
  ].filter(Boolean) as string[];
  const emailBody = [
    copy.emailBodyIntro,
    evidenceLines.length ? `${copy.emailEvidenceIntro}\n${evidenceLines.join('\n')}` : copy.noEvidenceLabel
  ].join('\n\n');

  return {
    title: copy.title,
    body: copy.body,
    referenceLabel: copy.referenceLabel,
    proofUrlLabel: copy.proofUrlLabel,
    noEvidenceLabel: copy.noEvidenceLabel,
    reference,
    proofUrl,
    emailSubject,
    emailBody
  };
}

export function customerOrderCodCollectionReminder(
  metadata?: Record<string, unknown> | null,
  orderNumber = '',
  locale?: string | null
): CustomerOrderCodCollectionReminder | null {
  if (!metadata || !isCodMethod(metadata)) return null;

  const normalizedLocale = normalizeCustomerOrderCopyLocale(locale);
  const copy = codCollectionReminderCopy[normalizedLocale];
  const collectionStatus = metadataText(metadata.codCollectionStatus) ?? 'pending';
  const settlementStatus = metadataText(metadata.codSettlementStatus);
  const settlementReference = metadataText(metadata.codSettlementReference);
  const collectionStatusLabel = copy.statusLabels[collectionStatus] ?? collectionStatus.replace(/_/g, ' ');
  const settlementStatusLabel = settlementStatus
    ? copy.settlementStatusLabels[settlementStatus] ?? settlementStatus.replace(/_/g, ' ')
    : copy.settlementStatusLabels.pending;
  const emailSubject = copy.emailSubject.replace('{{orderNumber}}', orderNumber || '—');
  const evidenceLines = [
    `${copy.statusLabel}: ${collectionStatusLabel}`,
    `${copy.settlementLabel}: ${settlementStatusLabel}`,
    settlementReference ? `${copy.settlementReferenceLabel}: ${settlementReference}` : undefined
  ].filter(Boolean) as string[];
  const emailBody = [
    copy.emailBodyIntro,
    `${copy.emailEvidenceIntro}\n${evidenceLines.join('\n')}`
  ].join('\n\n');

  return {
    title: copy.title,
    body: copy.body,
    statusLabel: copy.statusLabel,
    settlementLabel: copy.settlementLabel,
    settlementReferenceLabel: copy.settlementReferenceLabel,
    noSettlementReferenceLabel: copy.noSettlementReferenceLabel,
    collectionStatus: collectionStatusLabel,
    settlementStatus: settlementStatusLabel,
    settlementReference,
    emailSubject,
    emailBody
  };
}

export function customerOrderDateLocale(locale?: string | null): string {
  return normalizeCustomerOrderCopyLocale(locale) === 'fa' ? 'fa-IR' : 'en-CA';
}

export function customerOrderPaymentSummary(status?: string | null, locale?: string | null): string {
  if (!status) return getCustomerOrderCopy('payment.none', locale);
  if (status === 'verified_paid') return getCustomerOrderCopy('payment.verifiedPaid', locale);
  if (status === 'redirect_required') return getCustomerOrderCopy('payment.redirectRequired', locale);
  if (status === 'manual_pending') return getCustomerOrderCopy('payment.manualPending', locale);
  if (status === 'failed') return getCustomerOrderCopy('payment.failed', locale);
  if (status === 'cancelled') return getCustomerOrderCopy('payment.cancelled', locale);
  return status.replace(/_/g, ' ');
}

export function customerOrderItemCountLabel(count: number, locale?: string | null): string {
  const key = count === 1 ? 'itemSingular' : 'itemPlural';
  return `${count} ${getCustomerOrderCopy(key, locale)}`;
}

export function customerOrderMoreItemLabel(count: number, locale?: string | null): string {
  const key = count === 1 ? 'moreItemSingular' : 'moreItemPlural';
  return `${count} ${getCustomerOrderCopy(key, locale)}`;
}
