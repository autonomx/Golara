'use client';

import { useFormStatus } from 'react-dom';

export function StorefrontSubmitButton({
  label,
  pendingLabel,
  disabled = false,
  className
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
  className: string;
}) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={className}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
