type Workspace = 'overview' | 'catalog' | 'content' | 'sales';

type AdminDashboardStatusBannerProps = {
  status?: string;
  message?: string;
  statusLabels: Record<string, string>;
  t?: (key: string) => string;
};

type AdminDashboardIntroProps = {
  workspace: Workspace;
  productCount: number;
  categoryCount: number;
  mediaCount: number;
  t?: (key: string) => string;
};

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
      <div className="text-xl font-bold text-stone-950">{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">{label}</div>
    </div>
  );
}

export function AdminDashboardStatusBanner({ status, message, statusLabels, t = (key: string) => key }: AdminDashboardStatusBannerProps) {
  if (!status && !message) return null;

  const isError = status === 'error';
  const copy = message || statusLabels[status ?? ''] || status || '';

  return (
    <section className={`rounded-lg border p-5 text-sm font-semibold ${isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-olive/20 bg-white text-olive'}`}>
      {t(copy)}
    </section>
  );
}

export function AdminDashboardIntro({ workspace, productCount, categoryCount, mediaCount, t = (key: string) => key }: AdminDashboardIntroProps) {
  const copy = {
    catalog: ['Catalog workspace', 'Catalog', 'Products, categories, subcategories, and media.'],
    content: ['Content workspace', 'Homepage and translations', 'Homepage copy and translations.'],
    sales: ['Sales workspace', 'Sales', 'Orders and customer inquiries.'],
    overview: ['Overview workspace', 'System', 'Readiness, access, audit, and security.']
  }[workspace];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{t(copy[0])}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{t(copy[1])}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{t(copy[2])}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric value={productCount} label={t('Products')} />
          <Metric value={categoryCount} label={t('Categories')} />
          <Metric value={mediaCount} label={t('Media')} />
        </div>
      </div>
    </section>
  );
}
