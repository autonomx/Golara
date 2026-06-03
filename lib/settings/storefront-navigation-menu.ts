import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

export type StorefrontNavigationMenuItem = {
  id: string;
  menuId: string;
  parentId?: string | null;
  label: string;
  href: string;
  locale?: string | null;
  isVisible: boolean;
  opensInNewTab: boolean;
  sortOrder: number;
  updatedAt?: Date;
};

export type StorefrontNavigationMenu = {
  id: string;
  key: string;
  label: string;
  locale?: string | null;
  isActive: boolean;
  items: StorefrontNavigationMenuItem[];
  updatedAt?: Date;
};

export type StorefrontNavigationMenuItemInput = {
  id?: string | null;
  parentId?: string | null;
  label: string;
  href: string;
  locale?: string | null;
  isVisible: boolean;
  opensInNewTab: boolean;
  sortOrder: number;
};

export type StorefrontNavigationMenuInput = {
  key: string;
  label: string;
  locale?: string | null;
  isActive: boolean;
  items: StorefrontNavigationMenuItemInput[];
};

export const DEFAULT_STOREFRONT_NAVIGATION_MENU: StorefrontNavigationMenu = {
  id: 'storefront-navigation-primary',
  key: 'primary',
  label: 'Primary navigation',
  locale: null,
  isActive: true,
  items: [
    { id: 'nav-catalog', menuId: 'storefront-navigation-primary', label: 'Catalog', href: '/products', isVisible: true, opensInNewTab: false, sortOrder: 10 },
    { id: 'nav-occasions', menuId: 'storefront-navigation-primary', label: 'Occasions', href: '/#occasions', isVisible: true, opensInNewTab: false, sortOrder: 20 },
    { id: 'nav-available-today', menuId: 'storefront-navigation-primary', label: 'Available today', href: '/categories/available-today', isVisible: true, opensInNewTab: false, sortOrder: 30 },
    { id: 'nav-best-sellers', menuId: 'storefront-navigation-primary', label: 'Best sellers', href: '/#best-sellers', isVisible: true, opensInNewTab: false, sortOrder: 40 }
  ]
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function isMissingStorefrontNavigationTableError(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = error instanceof Error ? error.message : String(error);
  return code === 'P2010' && /StorefrontNavigationMenu|StorefrontNavigationMenuItem|42P01|does not exist/i.test(message);
}

export function normalizeStorefrontNavigationLocale(value?: string | null) {
  return optionalText(value)?.replace('_', '-') ?? null;
}

export function normalizeStorefrontNavigationHref(value: string) {
  const href = optionalText(value) ?? '/';
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('https://') || href.startsWith('http://')) return href;
  return `/${href}`;
}

export function normalizeStorefrontNavigationMenuInput(input: StorefrontNavigationMenuInput): StorefrontNavigationMenuInput {
  return {
    key: optionalText(input.key) ?? 'primary',
    label: optionalText(input.label) ?? 'Primary navigation',
    locale: normalizeStorefrontNavigationLocale(input.locale),
    isActive: input.isActive,
    items: input.items
      .map((item, index) => ({
        id: optionalText(item.id),
        parentId: optionalText(item.parentId),
        label: optionalText(item.label) ?? `Navigation item ${index + 1}`,
        href: normalizeStorefrontNavigationHref(item.href),
        locale: normalizeStorefrontNavigationLocale(item.locale),
        isVisible: item.isVisible,
        opensInNewTab: item.opensInNewTab,
        sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : (index + 1) * 10
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
  };
}

export function visibleStorefrontNavigationItems(items: StorefrontNavigationMenuItem[], locale?: string | null) {
  const normalizedLocale = normalizeStorefrontNavigationLocale(locale);
  return items
    .filter((item) => item.isVisible)
    .filter((item) => !normalizedLocale || !item.locale || item.locale === normalizedLocale)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

async function fetchMenuRows(key: string, locale?: string | null) {
  const normalizedLocale = normalizeStorefrontNavigationLocale(locale);
  return prisma.$queryRaw<StorefrontNavigationMenu[]>`
    SELECT "id", "key", "label", "locale", "isActive", "updatedAt"
    FROM "StorefrontNavigationMenu"
    WHERE "key" = ${key}
      AND ("locale" = ${normalizedLocale} OR "locale" IS NULL)
    ORDER BY CASE WHEN "locale" = ${normalizedLocale} THEN 0 ELSE 1 END
    LIMIT 1
  `;
}

async function fetchMenuItems(menuId: string) {
  return prisma.$queryRaw<StorefrontNavigationMenuItem[]>`
    SELECT "id", "menuId", "parentId", "label", "href", "locale", "isVisible", "opensInNewTab", "sortOrder", "updatedAt"
    FROM "StorefrontNavigationMenuItem"
    WHERE "menuId" = ${menuId}
    ORDER BY "sortOrder" ASC, "label" ASC
  `;
}

export const storefrontNavigationMenuService = {
  async get(key = 'primary', locale?: string | null): Promise<StorefrontNavigationMenu> {
    if (!hasDatabase()) return DEFAULT_STOREFRONT_NAVIGATION_MENU;

    try {
      const menus = await fetchMenuRows(key, locale);
      const menu = menus[0];
      if (!menu) return DEFAULT_STOREFRONT_NAVIGATION_MENU;

      return {
        ...menu,
        items: await fetchMenuItems(menu.id)
      };
    } catch (error) {
      if (isMissingStorefrontNavigationTableError(error)) return DEFAULT_STOREFRONT_NAVIGATION_MENU;
      throw error;
    }
  },

  async update(input: StorefrontNavigationMenuInput): Promise<StorefrontNavigationMenu> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeStorefrontNavigationMenuInput(input);
    const menus = await prisma.$queryRaw<StorefrontNavigationMenu[]>`
      INSERT INTO "StorefrontNavigationMenu" ("key", "label", "locale", "isActive")
      VALUES (${normalized.key}, ${normalized.label}, ${normalized.locale}, ${normalized.isActive})
      ON CONFLICT ("key", COALESCE("locale", '')) DO UPDATE SET
        "label" = EXCLUDED."label",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "key", "label", "locale", "isActive", "updatedAt"
    `;
    const menu = menus[0];

    await prisma.$executeRaw`DELETE FROM "StorefrontNavigationMenuItem" WHERE "menuId" = ${menu.id}`;

    for (const item of normalized.items) {
      await prisma.$executeRaw`
        INSERT INTO "StorefrontNavigationMenuItem" ("menuId", "parentId", "label", "href", "locale", "isVisible", "opensInNewTab", "sortOrder")
        VALUES (${menu.id}, ${item.parentId}, ${item.label}, ${item.href}, ${item.locale}, ${item.isVisible}, ${item.opensInNewTab}, ${item.sortOrder})
      `;
    }

    await recordAdminAuditLog({
      action: 'settings.storefront_navigation.update',
      entity: 'storefrontNavigationMenu',
      entityId: menu.id,
      summary: `Updated storefront navigation menu: ${menu.label}`,
      metadata: {
        key: menu.key,
        locale: menu.locale,
        isActive: menu.isActive,
        itemCount: normalized.items.length
      }
    });

    return {
      ...menu,
      items: await fetchMenuItems(menu.id)
    };
  }
};
