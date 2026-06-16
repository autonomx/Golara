export type CustomerInstallmentMessageLocale = 'en' | 'fa';

export type CustomerInstallmentApprovalStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'needs_follow_up';

export type CustomerInstallmentApprovalMessage = {
  status: CustomerInstallmentApprovalStatus;
  title: string;
  body: string;
  statusLabel: string;
  emailSubject: string;
  emailBody: string;
};

type CustomerInstallmentApprovalMessageCopy = {
  title: string;
  body: string;
  statusLabel: string;
  emailSubject: string;
  emailBody: string;
};

type CustomerInstallmentApprovalMessageRegistry = Record<
  CustomerInstallmentMessageLocale,
  Record<CustomerInstallmentApprovalStatus, CustomerInstallmentApprovalMessageCopy>
>;

const installmentApprovalMessageCopy: CustomerInstallmentApprovalMessageRegistry = {
  en: {
    pending_review: {
      title: 'Installment request under review',
      body: 'We are reviewing your installment request. We will show the approval decision and payment schedule here once staff complete the review.',
      statusLabel: 'Pending review',
      emailSubject: 'Installment request update for order {{orderNumber}}',
      emailBody: 'Your installment request is under review. We will notify you when a decision or follow-up request is recorded.'
    },
    approved: {
      title: 'Installment request approved',
      body: 'Your installment request has been approved. Review the schedule below and keep the upcoming due dates available before each payment.',
      statusLabel: 'Approved',
      emailSubject: 'Installment request approved for order {{orderNumber}}',
      emailBody: 'Your installment request has been approved. Please review the payment schedule in your account order details.'
    },
    rejected: {
      title: 'Installment request not approved',
      body: 'This installment request was not approved. You can review the order status here and contact support if you need a different payment method.',
      statusLabel: 'Not approved',
      emailSubject: 'Installment request update for order {{orderNumber}}',
      emailBody: 'Your installment request was not approved. Please review your order details or contact support for the next payment option.'
    },
    needs_follow_up: {
      title: 'Installment request needs follow-up',
      body: 'Staff need additional information before completing the installment review. Keep your account details current so we can finish the review.',
      statusLabel: 'Needs follow-up',
      emailSubject: 'Installment request follow-up for order {{orderNumber}}',
      emailBody: 'Your installment request needs follow-up before review can be completed. Please check your order details and support messages.'
    }
  },
  fa: {
    pending_review: {
      title: 'درخواست اقساط در حال بررسی است',
      body: 'درخواست خرید اقساطی شما در حال بررسی است. پس از ثبت نتیجه بررسی، وضعیت تایید و برنامه پرداخت در همین بخش نمایش داده می‌شود.',
      statusLabel: 'در انتظار بررسی',
      emailSubject: 'به‌روزرسانی درخواست اقساط سفارش {{orderNumber}}',
      emailBody: 'درخواست خرید اقساطی شما در حال بررسی است. پس از ثبت تصمیم یا درخواست پیگیری، به شما اطلاع داده می‌شود.'
    },
    approved: {
      title: 'درخواست اقساط تایید شد',
      body: 'درخواست خرید اقساطی شما تایید شده است. برنامه پرداخت زیر را مرور کنید و سررسیدهای بعدی را پیش از هر پرداخت در نظر داشته باشید.',
      statusLabel: 'تایید شده',
      emailSubject: 'درخواست اقساط سفارش {{orderNumber}} تایید شد',
      emailBody: 'درخواست خرید اقساطی شما تایید شده است. لطفاً برنامه پرداخت را در جزئیات سفارش حساب خود مرور کنید.'
    },
    rejected: {
      title: 'درخواست اقساط تایید نشد',
      body: 'این درخواست خرید اقساطی تایید نشد. می‌توانید وضعیت سفارش را اینجا مرور کنید و در صورت نیاز به روش پرداخت دیگر با پشتیبانی تماس بگیرید.',
      statusLabel: 'تایید نشده',
      emailSubject: 'به‌روزرسانی درخواست اقساط سفارش {{orderNumber}}',
      emailBody: 'درخواست خرید اقساطی شما تایید نشد. لطفاً جزئیات سفارش را بررسی کنید یا برای روش پرداخت بعدی با پشتیبانی تماس بگیرید.'
    },
    needs_follow_up: {
      title: 'درخواست اقساط نیازمند پیگیری است',
      body: 'برای تکمیل بررسی اقساط، اطلاعات بیشتری لازم است. اطلاعات حساب خود را به‌روز نگه دارید تا بررسی کامل شود.',
      statusLabel: 'نیازمند پیگیری',
      emailSubject: 'پیگیری درخواست اقساط سفارش {{orderNumber}}',
      emailBody: 'درخواست خرید اقساطی شما پیش از تکمیل بررسی نیازمند پیگیری است. لطفاً جزئیات سفارش و پیام‌های پشتیبانی را بررسی کنید.'
    }
  }
};

export function normalizeCustomerInstallmentMessageLocale(locale?: string | null): CustomerInstallmentMessageLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function metadataText(value: unknown) {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function normalizeApprovalStatus(value?: string | null): CustomerInstallmentApprovalStatus {
  if (value === 'approved' || value === 'rejected' || value === 'needs_follow_up') return value;
  return 'pending_review';
}

function isInstallmentMetadata(metadata: Record<string, unknown>) {
  const methodType = metadataText(metadata.paymentMethodType)?.toLowerCase();
  const methodKey = metadataText(metadata.paymentMethodKey)?.toLowerCase();
  return methodType === 'installment' || methodKey === 'installment-credit';
}

export function customerInstallmentApprovalMessage(
  metadata?: Record<string, unknown> | null,
  orderNumber = '',
  locale?: string | null
): CustomerInstallmentApprovalMessage | null {
  if (!metadata || !isInstallmentMetadata(metadata)) return null;

  const normalizedLocale = normalizeCustomerInstallmentMessageLocale(locale);
  const status = normalizeApprovalStatus(metadataText(metadata.installmentApprovalStatus));
  const copy = installmentApprovalMessageCopy[normalizedLocale][status];
  const formattedOrderNumber = orderNumber || '—';

  return {
    status,
    title: copy.title,
    body: copy.body,
    statusLabel: copy.statusLabel,
    emailSubject: copy.emailSubject.replace('{{orderNumber}}', formattedOrderNumber),
    emailBody: copy.emailBody
  };
}
