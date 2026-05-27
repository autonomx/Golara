import Image from 'next/image';
import Link from 'next/link';
import type { HomepageCategoryTile } from '@/lib/homepage-category-tiles';

export function HomepageCategoryTileCard({ tile, priority = false }: { tile: HomepageCategoryTile; priority?: boolean }) {
  return (
    <Link
      href={tile.href}
      aria-label={`View ${tile.title}`}
      className="group overflow-hidden rounded-[2rem] border border-rosewood/10 bg-white shadow-sm outline-none transition hover:-translate-y-1 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-olive/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-blush">
        <Image
          src={tile.image}
          alt={tile.title}
          fill
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
        />
      </div>
      <div className="p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-olive">{tile.subtitle}</p>
        <h3 className="mt-2 font-display text-2xl text-rosewood">{tile.title}</h3>
      </div>
    </Link>
  );
}
