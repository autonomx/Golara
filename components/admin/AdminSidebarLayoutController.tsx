'use client';

import { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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

          html[data-admin-sidebar-collapsed='true'] nav[aria-label='Product pagination'] {
            left: 5.25rem !important;
          }
        }
      `}</style>
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
