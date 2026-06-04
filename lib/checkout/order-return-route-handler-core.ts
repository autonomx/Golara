import {
  checkoutReturnApplyInput,
  checkoutReturnFallbackUrl,
  checkoutReturnSuccessUrl,
  type CheckoutReturnApplyInput,
  type CheckoutReturnResult
} from '@/lib/checkout/order-return-route-core';

export type CheckoutReturnRouteApply = (input: CheckoutReturnApplyInput) => Promise<CheckoutReturnResult>;

export type CheckoutReturnRouteHandlerResult = {
  redirectUrl: URL;
  applied: boolean;
  error?: unknown;
};

export async function checkoutReturnRouteRedirect(input: {
  requestUrl: string;
  applyResult: CheckoutReturnRouteApply;
}): Promise<CheckoutReturnRouteHandlerResult> {
  try {
    const result = await input.applyResult(checkoutReturnApplyInput(input.requestUrl));
    return {
      redirectUrl: checkoutReturnSuccessUrl(input.requestUrl, result),
      applied: true
    };
  } catch (error) {
    return {
      redirectUrl: checkoutReturnFallbackUrl(input.requestUrl),
      applied: false,
      error
    };
  }
}
