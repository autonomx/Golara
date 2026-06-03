import { redirect } from 'next/navigation';
import { getAdminIdentity } from '@/lib/admin-auth';

export default async function AdminProductDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ productId: string }> }) {
  const [{ productId }, identity] = await Promise.all([params, getAdminIdentity()]);

  if (!identity.authenticated) {
    redirect(`/admin/login?returnTo=${encodeURIComponent(`/admin/products/${productId}`)}`);
  }

  return children;
}
