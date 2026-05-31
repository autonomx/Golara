import { orderNextPath } from './order-next-path';

type CheckoutActionAttempt = {
  status: string;
  redirectUrl?: string | null;
};

type CheckoutActionOrder = {
  orderNumber: string;
  publicLookupToken?: string | null;
};

export function checkoutActionNextPath(order: CheckoutActionOrder, attempt: CheckoutActionAttempt) {
  return orderNextPath({
    orderNumber: order.orderNumber,
    publicLookupToken: order.publicLookupToken,
    attempt: {
      status: attempt.status,
      nextUrl: attempt.redirectUrl
    }
  });
}
