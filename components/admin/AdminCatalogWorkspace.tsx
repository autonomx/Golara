import type { Category, MediaItem, Product, ProductType } from '@/lib/catalog';
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
  t?: (key: string) => string;
};

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
  t = (key: string) => key
}: AdminCatalogWorkspaceProps) {
  const path = adminCatalogPath(catalogSection);
  const selectedProductColumns = parseAdminCatalogColumns(productColumns, adminProductColumnOptions, ['product', 'actions']) as AdminProductColumn[];
  const selectedMediaColumns = parseAdminCatalogColumns(mediaColumns, adminMediaColumnOptions, ['image', 'actions']) as AdminMediaColumn[];
  const productColumnsParam = adminCatalogColumnParam(selectedProductColumns, adminProductColumnOptions);
  const mediaColumnsParam = adminCatalogColumnParam(selectedMediaColumns, adminMediaColumnOptions);
  const columnParams = { productColumns: productColumnsParam, mediaColumns: mediaColumnsParam };
  const paginationParams = { catalogSearch, catalogCategory, catalogFlag, ...columnParams };
  const filteredProducts = filterAdminProducts(products, catalogSearch, catalogCategory, catalogFlag);
  const filteredCategories = filterAdminCategories(categories, catalogSearch);
  const pagedProducts = adminPageSlice(filteredProducts, productPage);
  const pagedCategories = adminPageSlice(filteredCategories, categoryPage);
  const pagedMedia = adminPageSlice(media, mediaPage);
  const showMediaSection = catalogSection === 'all' || catalogSection === 'media';
  const showCategorySection = catalogSection === 'all' || catalogSection === 'categories';
  const showProductSection = catalogSection === 'all' || catalogSection === 'products';

  return (
    <>
      <AdminCatalogControls
        categories={categories}
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
          categories={categories}
          products={products}
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
          categories={categories}
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
          categories={categories}
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
