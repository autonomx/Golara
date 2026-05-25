import Link from 'next/link';

export type PathTrailItem = {
  label: string;
  href?: string;
};

export function PathTrail({ items }: { items: PathTrailItem[] }) {
  return (
    <nav aria-label="Page path" className="mb-8 text-sm text-stone-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true" className="text-rosewood/30">/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="font-semibold text-rosewood underline decoration-rosewood/20 underline-offset-4 hover:decoration-rosewood">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
