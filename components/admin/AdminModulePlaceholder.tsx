type AdminModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  body: string;
  items: string[];
};

export function AdminModulePlaceholder({ eyebrow, title, body, items }: AdminModulePlaceholderProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{body}</p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm font-semibold text-stone-700">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
