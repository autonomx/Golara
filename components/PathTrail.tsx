import Link from 'next/link';

export type PathTrailItem = {
  label: string;
  href?: string;
};

export function PathTrail({ items, label = 'Page path' }: { items: PathTrailItem[]; label?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className="mb-8 text-sm text-stone-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const itemKey = `${item.href || item.label}-${index}`;
          return (
            <li key={itemKey} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true" className="text-rosewood/30">/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="font-semibold text-rosewood underline decoration-rosewood/20 underline-offset-4 hover:decoration-rosewood">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'font-semibold text-stone-700' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
