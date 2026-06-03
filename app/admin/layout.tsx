import type { ReactNode } from 'react';
import { AdminSidebarLayoutController } from '@/components/admin/AdminSidebarLayoutController';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminSidebarLayoutController />
      {children}
    </>
  );
}
