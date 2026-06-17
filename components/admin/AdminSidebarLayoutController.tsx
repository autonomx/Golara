'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CreditCard, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';

const storageKey = 'golara-admin-sidebar-collapsed';

export function AdminSidebarLayoutController() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const nextCollapsed = stored === 'true';
    setCollapsed(nextCollapsed);
    document.documentElement.dataset.adminSidebarCollapsed = String(nextCollapsed);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.adminSidebarCollapsed = String(collapsed);
    window.localStorage.setItem(storageKey, String(collapsed));
  }, [collapsed]);

  const showToggle = pathname !== '/admin/login';
  const showRootPaymentMethodsLink = pathname === '/admin';

  return (
    <>
      <style>{`
        main#main-content {
          max-width: 100vw;
          overflow-x: clip;
        }

        main#main-content > div,
        main#main-content > div > div,
        main#main-content section {
          min-width: 0;
          max-width: 100%;
        }

        main#main-content table {
          max-width: 100%;
        }

        @media (min-width: 1024px) {
          html[data-admin-sidebar-collapsed='true'] main#main-content > div {
            padding-left: 4.5rem !important;
            transition: padding-left 180ms ease;
          }

          html[data-admin-sidebar-collapsed='false'] main#main-content > div {
            transition: padding-left 180ms ease;
          }

          html[data-admin-sidebar-collapsed='true'] main#main-content aside {
            width: 4.5rem !important;
            overflow: hidden;
            transition: width 180ms ease;
          }

          html[data-admin-sidebar-collapsed='false'] main#main-content aside {
            transition: width 180ms ease;
          }

          html[data-admin-sidebar-collapsed='true'] main#main-content aside > div:first-child a {
            width: 3rem;
          }

          html[data-admin-sidebar-collapsed='true'] main#main-content aside > div:first-child a > span:nth-child(2),
          html[data-admin-sidebar-collapsed='true'] main#main-content aside nav p,
          html[data-admin-sidebar-collapsed='true'] main#main-content aside > div:last-child {
            opacity: 0;
            pointer-events: none;
          }

          html[data-admin-sidebar-collapsed='true'] main#main-content aside nav a {
            width: 3rem;
            overflow: hidden;
            white-space: nowrap;
          }

          html[data-admin-sidebar-collapsed='true'] main#main-content aside nav a svg {
            flex: 0 0 auto;
          }

          main#main-content[data-admin-root-sidebar-payment-methods='true'] aside nav a[href='/admin/payments/settlement'] {
            margin-top: 2.75rem;
          }

          html[data-admin-sidebar-collapsed='true'] .admin-root-payment-methods-link {
            left: 0.75rem;
            width: 3rem;
            overflow: hidden;
            white-space: nowrap;
          }

          html[data-admin-sidebar-collapsed='true'] .admin-root-payment-methods-link span {
            opacity: 0;
          }

          html[data-admin-sidebar-collapsed='true'] nav[aria-label='Product pagination'] {
            left: 5.25rem !important;
          }
        }
      `}</style>
      {showRootPaymentMethodsLink ? (
        <Link
          href="/admin/payment-methods"
          aria-label="Payment methods"
          className="admin-root-payment-methods-link fixed left-3 top-[22rem] z-40 hidden w-[16.5rem] items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-950 lg:inline-flex"
        >
          <CreditCard aria-hidden="true" className="h-4 w-4 flex-none" />
          <span>Payment methods</span>
        </Link>
      ) : null}
      {showToggle ? (
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'}
          className={`fixed top-20 z-[60] hidden h-10 w-10 items-center justify-center rounded-full border border-rosewood/15 bg-white text-rosewood shadow-lg shadow-stone-950/10 transition lg:inline-flex ${collapsed ? 'left-14' : 'left-[17rem]'}`}
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" className="h-5 w-5" /> : <PanelLeftClose aria-hidden="true" className="h-5 w-5" />}
        </button>
      ) : null}
    </>
  );
}
