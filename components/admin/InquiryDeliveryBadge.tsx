type DeliveryBadgeState = {
  label: string;
  className: string;
};

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function daysUntil(value: Date) {
  const today = startOfToday();
  const delivery = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  return Math.round((delivery.getTime() - today.getTime()) / 86400000);
}

function deliveryState(deliveryDate?: Date): DeliveryBadgeState {
  if (!deliveryDate) {
    return {
      label: 'No delivery date',
      className: 'border-stone-200 bg-stone-50 text-stone-600'
    };
  }

  const days = daysUntil(deliveryDate);
  if (days < 0) {
    return {
      label: 'Past delivery date',
      className: 'border-red-200 bg-red-50 text-red-700'
    };
  }
  if (days === 0) {
    return {
      label: 'Due today',
      className: 'border-rosewood/20 bg-white text-rosewood'
    };
  }
  if (days <= 2) {
    return {
      label: `Due in ${days} day${days === 1 ? '' : 's'}`,
      className: 'border-amber-200 bg-amber-50 text-amber-800'
    };
  }

  return {
    label: `Due in ${days} days`,
    className: 'border-olive/20 bg-cream text-olive'
  };
}

export function InquiryDeliveryBadge({ deliveryDate }: { deliveryDate?: Date }) {
  const state = deliveryState(deliveryDate);
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${state.className}`}>
      {state.label}
    </span>
  );
}
