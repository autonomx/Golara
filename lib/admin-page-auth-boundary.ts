import 'server-only';

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from './admin-auth';

export async function requireAdminRouteSession() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }
}
