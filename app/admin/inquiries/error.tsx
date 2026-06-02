'use client';

import { AdminRouteError } from '@/components/admin/AdminRouteError';

export default function AdminInquiriesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminRouteError title="Inquiries could not load" error={error} reset={reset} />;
}
