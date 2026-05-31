import type { Product } from '@/lib/catalog';
import { productRequiresQuote } from '@/lib/catalog';
import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';

export type ProductCheckoutExperience = 'inquiry-only' | 'assisted-draft' | 'gateway-capable';

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
};

function productHasPersistentId(product: Product) {
  return Boolean(product.id?.trim());
}

export function getProductCheckoutPolicy(input: ProductCheckoutPolicyInput): ProductCheckoutPolicy {
  const { product, dbReady, checkoutReadiness } = input;
  const hasProductId = productHasPersistentId(product);

  if (productRequiresQuote(product)) {
    return {
      experience: 'inquiry-only',
      canAddToCart: false,
      showOrderDraftForm: false,
      showInquiryForm: true,
      summary: 'Inquiry required',
      detail: 'This product requires staff confirmation before ordering.',
      reasonCode: 'product_requires_quote'
    };
  }

  if (!dbReady || !hasProductId) {
    return {
      experience: 'inquiry-only',
      canAddToCart: false,
      showOrderDraftForm: false,
      showInquiryForm: true,
      summary: 'Inquiry available',
      detail: 'Order drafts require a database-backed product record. Customers can still send an inquiry.',
      reasonCode: 'database_or_product_id_missing'
    };
  }

  if (checkoutReadiness.mode === 'inquiry') {
    return {
      experience: 'inquiry-only',
      canAddToCart: false,
      showOrderDraftForm: false,
      showInquiryForm: true,
      summary: 'Inquiry-first checkout',
      detail: 'This storefront is currently configured for inquiry-first customer follow-up.',
      reasonCode: 'checkout_mode_inquiry'
    };
  }

  if (checkoutReadiness.mode === 'gateway' && checkoutReadiness.blockers.length > 0) {
    return {
      experience: 'inquiry-only',
      canAddToCart: false,
      showOrderDraftForm: false,
      showInquiryForm: true,
      summary: 'Gateway checkout not ready',
      detail: 'Gateway checkout has readiness blockers, so this product falls back to inquiry.',
      reasonCode: 'gateway_not_ready'
    };
  }

  if (checkoutReadiness.mode === 'gateway') {
    return {
      experience: 'gateway-capable',
      canAddToCart: true,
      showOrderDraftForm: true,
      showInquiryForm: true,
      summary: 'Gateway-capable checkout',
      detail: 'This product can start checkout while inquiry remains available as a fallback.',
      reasonCode: 'gateway_ready'
    };
  }

  return {
    experience: 'assisted-draft',
    canAddToCart: true,
    showOrderDraftForm: true,
    showInquiryForm: true,
    summary: 'Assisted checkout',
    detail: 'This product can start a staff-visible order draft while inquiry remains available as a fallback.',
    reasonCode: 'checkout_mode_assisted'
  };
}
