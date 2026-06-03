import { AdminConsolePage } from '@/app/admin/AdminConsolePage';

export const dynamic = 'force-dynamic';

export default async function AdminReadinessPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  return <AdminConsolePage searchParams={searchParams} forcedTab="overview" overviewSection="readiness" activeNavKey="readiness" />;
}
