'use client';

import { useActionState } from 'react';
import { getCheckoutFlowCopy } from '@/lib/localization/checkout-flow-copy';
import { createCartCheckoutAction, type CartCheckoutActionState } from './actions';

type CheckoutFormShellProps = {
  children: React.ReactNode;
  className?: string;
  locale?: string | null;
};

const initialState: CartCheckoutActionState = { checkout: null };

export function CheckoutFormShell({ children, className, locale }: CheckoutFormShellProps) {
  const [state, formAction] = useActionState(createCartCheckoutAction, initialState);
  const message = getCheckoutFlowCopy(state.checkout, locale);

  return (
    <form action={formAction} className={className}>
      {message ? (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900" role="alert" aria-live="polite">
          {message}
        </div>
      ) : null}
      {children}
    </form>
  );
}
