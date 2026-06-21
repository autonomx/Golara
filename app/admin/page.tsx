import { AdminConsolePage } from '@/app/admin/AdminConsolePage';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';

export const dynamic = 'force-dynamic';

type AdminPageSearchParams = { [key: string]: string | undefined };

export default async function AdminPage({ searchParams }: { searchParams: Promise<AdminPageSearchParams> }) {
  await requireAdminRouteSession();

  const params = await searchParams;

  return <AdminConsolePage searchParams={Promise.resolve(params)} activeNavKey="overview" />;
}
