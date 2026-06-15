import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/HomepageCategoryTileCard.tsx', 'utf8');

for (const fragment of [
  "isFa ? 'bg-gradient-to-l from-stone-100/98 via-stone-100/82 to-stone-100/20' : 'bg-gradient-to-r from-stone-100/98 via-stone-100/82 to-stone-100/20'",
  "isFa ? 'right-0' : 'left-0'",
  'bg-stone-100/45 blur-3xl',
  'bg-[#fffaf4]/98',
  'text-stone-800',
  'text-stone-700',
  'backdrop-blur-md'
]) {
  assert.ok(source.includes(fragment), `Expected category card readability fragment: ${fragment}`);
}

assert.ok(!source.includes('bg-stone-50/92'), 'Expected category card panel to avoid the old translucent surface.');
assert.ok(!source.includes('from-stone-100/95 via-stone-100/72 to-transparent'), 'Expected category card veil to avoid the old low-contrast one-sided gradient.');

console.log('homepage category card readability guard passed');
