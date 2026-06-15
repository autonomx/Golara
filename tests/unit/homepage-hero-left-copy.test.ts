import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/HomepageBannerSlideshow.tsx', 'utf8');

for (const fragment of [
  'dir="ltr" className="relative z-10 flex',
  'items-center justify-start',
  'dir="auto" className="max-w-xl',
  'linear-gradient(90deg,rgba(255,248,241,0.98)_0%',
  'rgba(255,248,241,0.94)_28%',
  'circle_at_18%_34%',
  'bg-white/82',
  'drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]'
]) {
  assert.ok(source.includes(fragment), `Expected hero left-copy/readability fragment: ${fragment}`);
}

assert.ok(!source.includes('justify-end'), 'Hero copy should not be pushed to the visual right edge.');

console.log('homepage hero left-copy guard passed');
