import type { Product } from '@/lib/catalog';
import { productRequiresQuote } from '@/lib/catalog-pricing';
import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';

export type ProductCheckoutExperience = 'inquiry-only' | 'inquiry-cart' | 'assisted-draft' | 'gateway-capable';

export type ProductCheckoutPolicy = {
  experience: ProductCheckoutExperience;
  canAddToCart: boolean;
  showOrderDraftForm: boolean;
  showInquiryForm: boolean;
  summary: string;
  detail: string;
  reasonCode: string;
};

type ProductCheckoutPolicyInput = {
  product: Product;
  dbReady: boolean;
  checkoutReadiness: PaymentGatewayReadiness;
  locale?: string | null;
};

type CheckoutPolicyReasonCode =
  | 'product_requires_quote'
  | 'database_or_product_id_missing'
  | 'checkout_mode_inquiry'
  | 'gateway_not_ready'
  | 'gateway_ready'
  | 'checkout_mode_assisted';

const policyCopy: Record<'en' | 'fa', Record<CheckoutPolicyReasonCode, { summary: string; detail: string }>> = {
  en: {
    product_requires_quote: {
      summary: 'Inquiry required',
      detail: 'This product requires staff confirmation before ordering.'
    },
    database_or_product_id_missing: {
      summary: 'Inquiry available',
      detail: 'Order drafts require a database-backed product record. Customers can still send an inquiry.'
    },
    checkout_mode_inquiry: {
      summary: 'Cart available',
      detail: 'Customers can add this product to cart before inquiry-first staff follow-up.'
    },
    gateway_not_ready: {
      summary: 'Cart available',
      detail: 'Customers can add this product to cart while payment readiness blockers fall back to staff follow-up.'
    },
    gateway_ready: {
      summary: 'Gateway-capable checkout',
      detail: 'This product can start checkout while inquiry remains available as a fallback.'
    },
    checkout_mode_assisted: {
      summary: 'Assisted checkout',
      detail: 'This product can start a staff-visible order draft while inquiry remains available as a fallback.'
    }
  },
  fa: {
    product_requires_quote: {
      summary: 'نیازمند درخواست',
      detail: 'این محصول پیش از سفارش به تأیید تیم فروش نیاز دارد.'
    },
    database_or_product_id_missing: {
      summary: 'امکان ارسال درخواست',
      detail: 'ثبت پیش‌نویس سفارش به رکورد محصول در پایگاه داده نیاز دارد. مشتری همچنان می‌تواند درخواست ارسال کند.'
    },
    checkout_mode_inquiry: {
      summary: 'سبد خرید در دسترس است',
      detail: 'مشتریان می‌توانند این محصول را پیش از پیگیری تیم فروش به سبد خرید اضافه کنند.'
    },
    gateway_not_ready: {
      summary: 'سبد خرید در دسترس است',
      detail: 'مشتریان می‌توانند این محصول را به سبد خرید اضافه کنند و تا آماده شدن پرداخت، تیم فروش پیگیری می‌کند.'
    },
    gateway_ready: {
      summary: 'آماده پرداخت از درگاه',
      detail: 'این محصول می‌تواند فرایند پرداخت را آغاز کند و درخواست همچنان به عنوان جایگزین در دسترس است.'
    },
    checkout_mode_assisted: {
      summary: 'پرداخت با راهنمایی تیم فروش',
      detail: 'این محصول می‌تواند پیش‌نویس سفارش قابل مشاهده برای تیم فروش ایجاد کند و درخواست همچنان در دسترس است.'
    }
  }
};

function productHasPersistentId(product: Product) {
  return Boolean(product.id?.trim());
}

function localizedPolicyText(reasonCode: CheckoutPolicyReasonCode, locale?: string | null) {
  return policyCopy[locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en'][reasonCode];
}

function buildPolicy(reasonCode: CheckoutPolicyReasonCode, locale: string | null | undefined, policy: Omit<ProductCheckoutPolicy, 'summary' | 'detail' | 'reasonCode'>): ProductCheckoutPolicy {
  const text = localizedPolicyText(reasonCode, locale);
  return {
    ...policy,
    summary: text.summary,
    detail: text.detail,
    reasonCode
  };
}

export function getProductCheckoutPolicy(input: ProductCheckoutPolicyInput): ProductCheckoutPolicy {
  const { product, dbReady, checkoutReadiness, locale } = input;
  const hasProductId = productHasPersistentId(product);

  if (productRequiresQuote(product)) {
    return buildPolicy('product_requires_quote', locale, {
      experience: 'inquiry-only',
      canAddToCart: false,
      showOrderDraftForm: false,
      showInquiryForm: true
    });
  }

  if (!dbReady || !hasProductId) {
    return buildPolicy('database_or_product_id_missing', locale, {
      experience: 'inquiry-only',
      canAddToCart: false,
      showOrderDraftForm: false,
      showInquiryForm: true
    });
  }

  if (checkoutReadiness.mode === 'inquiry') {
    return buildPolicy('checkout_mode_inquiry', locale, {
      experience: 'inquiry-cart',
      canAddToCart: true,
      showOrderDraftForm: false,
      showInquiryForm: true
    });
  }

  if (checkoutReadiness.mode === 'gateway' && checkoutReadiness.blockers.length > 0) {
    return buildPolicy('gateway_not_ready', locale, {
      experience: 'inquiry-cart',
      canAddToCart: true,
      showOrderDraftForm: false,
      showInquiryForm: true
    });
  }

  if (checkoutReadiness.mode === 'gateway') {
    return buildPolicy('gateway_ready', locale, {
      experience: 'gateway-capable',
      canAddToCart: true,
      showOrderDraftForm: true,
      showInquiryForm: true
    });
  }

  return buildPolicy('checkout_mode_assisted', locale, {
    experience: 'assisted-draft',
    canAddToCart: true,
    showOrderDraftForm: true,
    showInquiryForm: true
  });
}
