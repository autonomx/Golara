import type { CatalogTranslation, Category, MediaItem, Product, ProductType } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { AdminCatalogControls } from '@/components/admin/AdminCatalogControls';
import { AdminCategorySection } from '@/components/admin/AdminCategorySection';
import { AdminMediaSection } from '@/components/admin/AdminMediaSection';
import { AdminProductSection } from '@/components/admin/AdminProductSection';
import {
  adminCatalogColumnParam,
  adminCatalogPath,
  adminMediaColumnOptions,
  adminPageSlice,
  adminProductColumnOptions,
  adminProductMatchesFlag,
  includesAdminCatalogText,
  parseAdminCatalogColumns,
  type AdminCatalogSection,
  type AdminMediaColumn,
  type AdminProductColumn
} from '@/lib/admin/admin-catalog-dashboard-helpers';
import { getLocalizedCategorySeedCopy } from '@/lib/localization/catalog-seed-fallback';

type AdminCatalogWorkspaceProps = {
  catalogSection?: AdminCatalogSection;
  categories: Category[];
  products: Product[];
  productTypes: ProductType[];
  media: MediaItem[];
  disabled: boolean;
  catalogSearch?: string;
  catalogCategory?: string;
  catalogFlag?: string;
  productPage?: number;
  categoryPage?: number;
  mediaPage?: number;
  productColumns?: string | string[];
  mediaColumns?: string | string[];
  locale?: SupportedLocale | string | null;
  t?: (key: string) => string;
};

function adminCatalogLocale(locale?: SupportedLocale | string | null): SupportedLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa-IR' : 'en-CA';
}

function publishedTranslation(translations: CatalogTranslation[] | undefined, locale: SupportedLocale) {
  return translations?.find((translation) => translation.locale === locale && translation.isPublished !== false);
}

function localizeCategoryForAdmin(category: Category, locale: SupportedLocale): Category {
  const translation = publishedTranslation(category.translations, locale);
  const seedCopy = getLocalizedCategorySeedCopy(category.slug, locale);

  return {
    ...category,
    title: translation?.title?.trim() || seedCopy?.title || category.title,
    eyebrow: translation?.eyebrow?.trim() || seedCopy?.eyebrow || category.eyebrow,
    description: translation?.description?.trim() || seedCopy?.description || category.description
  };
}

function localizeCategoriesForAdmin(categories: Category[], locale?: SupportedLocale | string | null) {
  const resolvedLocale = adminCatalogLocale(locale);
  const localizedCategories = categories.map((category) => localizeCategoryForAdmin(category, resolvedLocale));
  const categoryById = new Map(localizedCategories.filter((category) => category.id).map((category) => [category.id, category]));
  const categoryBySlug = new Map(localizedCategories.map((category) => [category.slug, category]));

  return localizedCategories.map((category) => {
    const parent = category.parentId ? categoryById.get(category.parentId) : category.parentSlug ? categoryBySlug.get(category.parentSlug) : undefined;
    return parent ? { ...category, parentTitle: parent.title } : category;
  });
}

function localizeProductsForAdmin(products: Product[], categories: Category[], locale?: SupportedLocale | string | null) {
  const resolvedLocale = adminCatalogLocale(locale);
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  return products.map((product) => {
    const translation = publishedTranslation(product.translations, resolvedLocale);
    const category = categoryBySlug.get(product.category);

    return {
      ...product,
      title: translation?.title?.trim() || product.title,
      description: translation?.description?.trim() || product.description,
      categoryTitle: category?.title ?? product.categoryTitle
    };
  });
}

function filterAdminProducts(products: Product[], catalogSearch?: string, catalogCategory?: string, catalogFlag?: string) {
  const search = catalogSearch?.trim();

  return products.filter((product) => {
    const matchesSearch = !search
      || includesAdminCatalogText(product.title, search)
      || includesAdminCatalogText(product.code, search)
      || includesAdminCatalogText(product.slug, search)
      || includesAdminCatalogText(product.description, search);
    const matchesCategory = !catalogCategory || product.category === catalogCategory;

    return matchesSearch && matchesCategory && adminProductMatchesFlag(product, catalogFlag);
  });
}

function filterAdminCategories(categories: Category[], catalogSearch?: string) {
  const search = catalogSearch?.trim();

  return categories.filter((category) => !search
    || includesAdminCatalogText(category.title, search)
    || includesAdminCatalogText(category.slug, search)
    || includesAdminCatalogText(category.description, search)
    || includesAdminCatalogText(category.parentTitle, search));
}

export function AdminCatalogWorkspace({
  catalogSection = 'all',
  categories,
  products,
  productTypes,
  media,
  disabled,
  catalogSearch,
  catalogCategory,
  catalogFlag,
  productPage = 1,
  categoryPage = 1,
  mediaPage = 1,
  productColumns,
  mediaColumns,
  locale,
  t = (key: string) => key
}: AdminCatalogWorkspaceProps) {
  const localizedCategories = localizeCategoriesForAdmin(categories, locale);
  const localizedProducts = localizeProductsForAdmin(products, localizedCategories, locale);
  const path = adminCatalogPath(catalogSection);
  const selectedProductColumns = parseAdminCatalogColumns(productColumns, adminProductColumnOptions, ['product', 'actions']) as AdminProductColumn[];
  const selectedMediaColumns = parseAdminCatalogColumns(mediaColumns, adminMediaColumnOptions, ['image', 'actions']) as AdminMediaColumn[];
  const productColumnsParam = adminCatalogColumnParam(selectedProductColumns, adminProductColumnOptions);
  const mediaColumnsParam = adminCatalogColumnParam(selectedMediaColumns, adminMediaColumnOptions);
  const columnParams = { productColumns: productColumnsParam, mediaColumns: mediaColumnsParam };
  const paginationParams = { catalogSearch, catalogCategory, catalogFlag, ...columnParams };
  const filteredProducts = filterAdminProducts(localizedProducts, catalogSearch, catalogCategory, catalogFlag);
  const filteredCategories = filterAdminCategories(localizedCategories, catalogSearch);
  const pagedProducts = adminPageSlice(filteredProducts, productPage);
  const pagedCategories = adminPageSlice(filteredCategories, categoryPage);
  const pagedMedia = adminPageSlice(media, mediaPage);
  const showMediaSection = catalogSection === 'all' || catalogSection === 'media';
  const showCategorySection = catalogSection === 'all' || catalogSection === 'categories';
  const showProductSection = catalogSection === 'all' || catalogSection === 'products';

  return (
    <>
      <AdminCatalogControls
        categories={localizedCategories}
        section={catalogSection}
        search={catalogSearch}
        category={catalogCategory}
        flag={catalogFlag}
        columnParams={columnParams}
        showSectionNav={catalogSection === 'all'}
        t={t}
      />
      {showMediaSection ? (
        <AdminMediaSection
          categories={localizedCategories}
          products={localizedProducts}
          disabled={disabled}
          path={path}
          catalogSection={catalogSection}
          catalogSearch={catalogSearch}
          catalogCategory={catalogCategory}
          catalogFlag={catalogFlag}
          productColumnsParam={productColumnsParam}
          selectedMediaColumns={selectedMediaColumns}
          pagedMedia={pagedMedia}
          totalMedia={media.length}
          paginationParams={paginationParams}
          t={t}
        />
      ) : null}
      {showCategorySection ? (
        <AdminCategorySection
          categories={localizedCategories}
          media={media}
          pagedCategories={pagedCategories}
          filteredCategoryCount={filteredCategories.length}
          path={path}
          paginationParams={paginationParams}
          catalogSection={catalogSection === 'all' ? 'all' : 'categories'}
          disabled={disabled}
          t={t}
        />
      ) : null}
      {showProductSection ? (
        <AdminProductSection
          products={pagedProducts.items}
          categories={localizedCategories}
          productTypes={productTypes}
          media={media}
          disabled={disabled}
          columns={selectedProductColumns}
          path={path}
          pagination={{
            currentPage: pagedProducts.currentPage,
            pageCount: pagedProducts.pageCount,
            total: filteredProducts.length,
            start: pagedProducts.start,
            end: pagedProducts.end
          }}
          paginationParams={paginationParams}
          columnHiddenInputs={{
            tab: catalogSection === 'all' ? 'catalog' : undefined,
            catalogSearch,
            catalogCategory,
            catalogFlag,
            mediaColumns: mediaColumnsParam
          }}
          showCategoryBackLink={catalogSection === 'all'}
          t={t}
        />
      ) : null}
    </>
  );
}
