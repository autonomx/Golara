'use client';

import { useMemo, useState } from 'react';
import type { MediaItem } from '@/lib/catalog';

type MediaSelectWithPreviewProps = {
  label: string;
  name: string;
  media: MediaItem[];
  defaultValue?: string;
  disabled: boolean;
  className: string;
};

export function MediaSelectWithPreview({ label, name, media, defaultValue, disabled, className }: MediaSelectWithPreviewProps) {
  const [selectedUrl, setSelectedUrl] = useState(defaultValue ?? '');
  const selected = useMemo(() => media.find((item) => item.url === selectedUrl), [media, selectedUrl]);

  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <div className="grid gap-3 sm:grid-cols-[96px_1fr] sm:items-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-rosewood/10 bg-blush">
          {selectedUrl ? <img src={selectedUrl} alt={selected?.alt || 'Selected media preview'} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-3 text-center text-xs text-rosewood/55">No image</div>}
        </div>
        <select className={className} name={name} value={selectedUrl} disabled={disabled} onChange={(event) => setSelectedUrl(event.currentTarget.value)}>
          <option value="">Choose from media library...</option>
          {media.map((item) => <option key={item.url} value={item.url}>{item.alt}</option>)}
        </select>
      </div>
      {selectedUrl ? <span className="break-all text-xs font-normal text-stone-500">{selectedUrl}</span> : null}
    </label>
  );
}
