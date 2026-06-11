import { AdminConsolePage } from '@/app/admin/AdminConsolePage';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  await requireAdminRouteSession();

  return <AdminConsolePage searchParams={searchParams} forcedTab="overview" overviewSection="audit" activeNavKey="audit" />;
}
