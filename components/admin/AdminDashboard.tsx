import type { Category, HomepageContent, Product } from '@/lib/catalog';
import {
  createCategoryAction,
  createProductAction,
  updateCategoryAction,
  updateHomepageAction,
  updateProductAction
} from '@/app/admin/actions';

type AdminDashboardProps = {
  categories: Category[];
  products: Product[];
  homepage: HomepageContent;
  databaseReady: boolean;
};

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = 'text',
  required = true,
  disabled = false
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <input
        className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100"
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  disabled = false
}: {
  label: string;
  name: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <textarea
        className="min-h-28 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100"
        name={name}
        defaultValue={defaultValue}
        required
        disabled={disabled}
      />
    </label>
  );
}

function Toggle({
  label,
  name,
  defaultChecked = true,
  disabled = false
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />
      {label}
    </label>
  );
}

function SubmitButton({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  return (
    <button
      className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
      type="submit"
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function categoryDefaultValue(product: Product, categories: Category[]) {
  return product.categoryId ?? categories.find((category) => category.slug === product.category)?.id ?? '';
}

export function AdminDashboard({ categories, products, homepage, databaseReady }: AdminDashboardProps) {
  const disabled = !databaseReady;

  return (
    <div className="space-y-12">
      <section className={`rounded-[2rem] border p-6 ${databaseReady ? 'border-olive/20 bg-white' : 'border-amber-300 bg-amber-50'}`}>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">CMS status</p>
        <h2 className="mt-3 font-display text-3xl text-rosewood">
          {databaseReady ? 'Database connected' : 'Seeded preview mode'}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">
          {databaseReady
            ? 'Admin forms are live. Changes write to Prisma, then revalidate storefront pages.'
            : 'The storefront is reading seeded fallback content. Add DATABASE_URL, run npm run db:push and npm run db:seed, then restart the app to enable editing.'}
        </p>
      </section>

      <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Homepage</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">Hero content</h2>
        </div>
        <form action={updateHomepageAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow" name="eyebrow" defaultValue={homepage.eyebrow} disabled={disabled} />
            <Field label="Title" name="title" defaultValue={homepage.title} disabled={disabled} />
          </div>
          <TextArea label="Body" name="body" defaultValue={homepage.body} disabled={disabled} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Primary CTA label" name="primaryCtaLabel" defaultValue={homepage.primaryCtaLabel} disabled={disabled} />
            <Field label="Primary CTA URL" name="primaryCtaHref" defaultValue={homepage.primaryCtaHref} disabled={disabled} />
            <Field label="Secondary CTA label" name="secondaryCtaLabel" defaultValue={homepage.secondaryCtaLabel} disabled={disabled} />
            <Field label="Secondary CTA URL" name="secondaryCtaHref" defaultValue={homepage.secondaryCtaHref} disabled={disabled} />
            <Field label="Panel eyebrow" name="panelEyebrow" defaultValue={homepage.panelEyebrow} disabled={disabled} />
            <Field label="Panel title" name="panelTitle" defaultValue={homepage.panelTitle} disabled={disabled} />
          </div>
          <TextArea label="Panel body" name="panelBody" defaultValue={homepage.panelBody} disabled={disabled} />
          <SubmitButton disabled={disabled}>Save homepage</SubmitButton>
        </form>
      </section>

      <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Categories</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">Create category</h2>
        </div>
        <form action={createCategoryAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" name="title" placeholder="Condolences" disabled={disabled} />
            <Field label="Slug" name="slug" placeholder="condolences" required={false} disabled={disabled} />
            <Field label="Eyebrow" name="eyebrow" placeholder="Sympathy flowers" disabled={disabled} />
            <Field label="Sort order" name="sortOrder" type="number" defaultValue={100} disabled={disabled} />
          </div>
          <TextArea label="Description" name="description" disabled={disabled} />
          <Toggle label="Visible on storefront" name="isActive" disabled={disabled} />
          <SubmitButton disabled={disabled}>Create category</SubmitButton>
        </form>

        <div className="mt-8 grid gap-5">
          {categories.map((category) => (
            <form key={category.slug} action={updateCategoryAction.bind(null, category.id ?? '')} className="grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Title" name="title" defaultValue={category.title} disabled={disabled || !category.id} />
                <Field label="Slug" name="slug" defaultValue={category.slug} disabled={disabled || !category.id} />
                <Field label="Eyebrow" name="eyebrow" defaultValue={category.eyebrow} disabled={disabled || !category.id} />
                <Field label="Sort order" name="sortOrder" type="number" defaultValue={category.sortOrder ?? 100} disabled={disabled || !category.id} />
              </div>
              <TextArea label="Description" name="description" defaultValue={category.description} disabled={disabled || !category.id} />
              <Toggle label="Visible on storefront" name="isActive" defaultChecked={category.isActive !== false} disabled={disabled || !category.id} />
              <SubmitButton disabled={disabled || !category.id}>Update category</SubmitButton>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Products</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">Create product</h2>
        </div>
        <form action={createProductAction} className="grid gap-4">
          <ProductFields categories={categories} disabled={disabled} />
          <SubmitButton disabled={disabled}>Create product</SubmitButton>
        </form>

        <div className="mt-8 grid gap-5">
          {products.map((product) => (
            <form key={product.slug} action={updateProductAction.bind(null, product.id ?? '')} className="grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-5">
              <ProductFields product={product} categories={categories} disabled={disabled || !product.id} />
              <SubmitButton disabled={disabled || !product.id}>Update product</SubmitButton>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductFields({
  product,
  categories,
  disabled
}: {
  product?: Product;
  categories: Category[];
  disabled: boolean;
}) {
  const selectedCategory = product ? categoryDefaultValue(product, categories) : categories[0]?.id ?? '';

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" name="title" defaultValue={product?.title} placeholder="Rose Garden Box" disabled={disabled} />
        <Field label="Slug" name="slug" defaultValue={product?.slug} placeholder="rose-garden-box" required={false} disabled={disabled} />
        <Field label="Product code" name="code" defaultValue={product?.code} placeholder="GL-4001" disabled={disabled} />
        <Field label="Price" name="price" type="number" defaultValue={product?.price ?? 0} disabled={disabled} />
        <Field label="Currency" name="currency" defaultValue={product?.currency ?? 'CAD'} disabled={disabled} />
        <label className="grid gap-2 text-sm font-semibold text-rosewood">
          Category
          <select
            className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100"
            name="categoryId"
            defaultValue={selectedCategory}
            required
            disabled={disabled}
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.id ?? ''}>
                {category.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Field label="Image URL" name="imageUrl" defaultValue={product?.image} placeholder="https://..." disabled={disabled} />
      <TextArea label="Description" name="description" defaultValue={product?.description} disabled={disabled} />
      <div className="grid gap-3 md:grid-cols-3">
        <Toggle label="Visible on storefront" name="isActive" defaultChecked={product?.isActive !== false} disabled={disabled} />
        <Toggle label="Best seller" name="bestSeller" defaultChecked={Boolean(product?.bestSeller)} disabled={disabled} />
        <Toggle label="Available today" name="availableToday" defaultChecked={Boolean(product?.availableToday)} disabled={disabled} />
      </div>
    </>
  );
}
