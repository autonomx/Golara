export const orderStatusLabels: Record<string, string> = {
  draft: 'Received by the shop',
  pending_payment: 'Waiting for payment or staff confirmation',
  paid: 'Payment received',
  preparing: 'Being prepared',
  out_for_delivery: 'Out for delivery',
  fulfilled: 'Completed',
  cancelled: 'Cancelled'
};

export const fulfillmentStatusLabels: Record<string, string> = {
  not_scheduled: 'Not scheduled yet',
  scheduled: 'Scheduled',
  preparing: 'Being prepared',
  ready_for_delivery: 'Ready for delivery',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  issue: 'Needs staff review'
};

export const resultMessages: Record<string, { title: string; body: string; tone: 'success' | 'warning' }> = {
  paid: {
    title: 'Payment result received',
    body: 'Thank you. Your order is now marked as paid while staff continue preparing the order.',
    tone: 'success'
  },
  failed: {
    title: 'Payment was not completed',
    body: 'The shop still has your order draft. Staff can help you complete the next step.',
    tone: 'warning'
  },
  cancelled: {
    title: 'Payment was cancelled',
    body: 'Your order draft remains available for staff follow-up if you still want to continue.',
    tone: 'warning'
  }
};

export function labelFor(map: Record<string, string>, value: string) {
  return map[value] || value.replace(/_/g, ' ');
}
