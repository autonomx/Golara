import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/admin/AdminRouteLoading.tsx', 'utf8');

for (const fragment of [
  "const shimmerClass = 'relative overflow-hidden",
  'before:animate-[shimmer_1.8s_ease-in-out_infinite]',
  'motion-reduce:before:animate-none',
  '<p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">{t(eyebrow)}</p>',
  '<h2 className="mt-1 text-2xl font-bold text-stone-950">{t(title)}</h2>',
  "{t('Loading admin')}…",
  'aria-hidden="true" className="grid gap-5 px-3 py-4"',
  'aria-hidden="true" className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"'
]) {
  assert.ok(source.includes(fragment), `Expected admin loading shell performance fragment: ${fragment}`);
}

for (const staleFragment of [
  '<div className="h-4 w-40 rounded bg-stone-100" />',
  '<div className="mt-4 h-8 w-72 max-w-full rounded bg-stone-100" />',
  '<div className="mt-3 h-4 w-full max-w-2xl rounded bg-stone-100" />'
]) {
  assert.ok(!source.includes(staleFragment), `Expected static placeholder fragment to be replaced: ${staleFragment}`);
}

console.log('admin route loading performance guard passed');
