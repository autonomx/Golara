import { AdminConsolePage } from '@/app/admin/AdminConsolePage';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  return <AdminConsolePage searchParams={searchParams} forcedTab="overview" overviewSection="audit" activeNavKey="audit" />;
}
