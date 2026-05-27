type SeedImageKind = 'box' | 'bouquet' | 'pot' | 'gift' | 'daily';

type SeedImageDescriptor = {
  slug: string;
  code: string;
  kind: SeedImageKind;
  dark: string;
  main: string;
  light: string;
  background: string;
};

const catalogImagePrefix = '/seed-images/catalog';
const photoImagePrefix = '/seed-images/photo-catalog';

const photoStyleSlugs = new Set([
  'vip-box-blue',
  'signiture-round-baby-pink',
  'imperium-vip-red-roses',
  'imperium-vip-peach',
  'woshe-grand-cream',
  'woshe-round-hand-bouquet-honey-rose',
  'woshe-round-hand-bouquet-ruby-harmony',
  'woshe-round-hand-bouquet-white-lily',
  'steel-bloom-wild-1001372',
  'woshe-christmas-collection-round-hand-bouquet',
  'vip-box-red-pink',
  'imperium-pink'
]);

const descriptors: Record<string, SeedImageDescriptor> = {
  'vip-box-blue': { slug: 'vip-box-blue', code: '1004488', kind: 'box', dark: '#1f4f7a', main: '#3c7fb1', light: '#d7ecff', background: '#f5f9ff' },
  'signiture-round-baby-pink': { slug: 'signiture-round-baby-pink', code: '1001519', kind: 'box', dark: '#d77b9f', main: '#f2b6cc', light: '#fde9f1', background: '#fff7fa' },
  'imperium-vip-red-roses': { slug: 'imperium-vip-red-roses', code: '1001495', kind: 'box', dark: '#99243e', main: '#d64365', light: '#ffd6df', background: '#fff3f6' },
  'imperium-vip-peach': { slug: 'imperium-vip-peach', code: '1001494', kind: 'box', dark: '#d9825b', main: '#f0b38f', light: '#ffe2d1', background: '#fff7f2' },
  'woshe-grand-cream': { slug: 'woshe-grand-cream', code: '1001471', kind: 'box', dark: '#b79873', main: '#dbc0a2', light: '#f6ead9', background: '#fffbf6' },
  'woshe-round-hand-bouquet-honey-rose': { slug: 'woshe-round-hand-bouquet-honey-rose', code: '1001467', kind: 'bouquet', dark: '#b77133', main: '#d8a05d', light: '#ffe8bf', background: '#fff8ea' },
  'woshe-round-hand-bouquet-ruby-harmony': { slug: 'woshe-round-hand-bouquet-ruby-harmony', code: '1001466', kind: 'bouquet', dark: '#9f3152', main: '#d96689', light: '#ffdce7', background: '#fff6f9' },
  'woshe-round-hand-bouquet-white-lily': { slug: 'woshe-round-hand-bouquet-white-lily', code: '1001464', kind: 'bouquet', dark: '#8b9b89', main: '#c3d3bf', light: '#f4faf0', background: '#ffffff' },
  'steel-bloom-wild-1001372': { slug: 'steel-bloom-wild-1001372', code: '1001372', kind: 'pot', dark: '#4f6a78', main: '#88a6b5', light: '#d7e7ee', background: '#f6fbfd' },
  'woshe-christmas-collection-round-hand-bouquet': { slug: 'woshe-christmas-collection-round-hand-bouquet', code: '1001187', kind: 'bouquet', dark: '#48643b', main: '#b94949', light: '#f0dfc2', background: '#fffaf0' },
  'vip-box-red-pink': { slug: 'vip-box-red-pink', code: '1001153', kind: 'box', dark: '#9d2f4a', main: '#e78aa2', light: '#ffd9e3', background: '#fff3f7' },
  'imperium-pink': { slug: 'imperium-pink', code: '1001148', kind: 'box', dark: '#c2618c', main: '#e8aac4', light: '#fde5ef', background: '#fff8fb' },
  'teddy-bouquet': { slug: 'teddy-bouquet', code: '1001139', kind: 'gift', dark: '#b56d4e', main: '#f3c59d', light: '#ffead8', background: '#fff8f2' },
  'steel-bloom-wild-1001110': { slug: 'steel-bloom-wild-1001110', code: '1001110', kind: 'pot', dark: '#56707d', main: '#9ab4bf', light: '#deebf0', background: '#f8fbfc' },
  'autumn-design-2': { slug: 'autumn-design-2', code: '1001090', kind: 'daily', dark: '#ad6940', main: '#df9b62', light: '#f5d3a7', background: '#fff6ea' },
  'dark-blue-design': { slug: 'dark-blue-design', code: '1001086', kind: 'daily', dark: '#234869', main: '#5b87b4', light: '#d8e8fa', background: '#f5f9ff' },
  'pastel-green-design': { slug: 'pastel-green-design', code: '1001082', kind: 'daily', dark: '#7ca07a', main: '#b9d7b2', light: '#e4f2de', background: '#fbfffa' },
  'yellow-pink-design': { slug: 'yellow-pink-design', code: '1001077', kind: 'daily', dark: '#d5a23d', main: '#eba0b6', light: '#ffe7a7', background: '#fff8f0' },
  'woshe-round-hand-bouquet-red': { slug: 'woshe-round-hand-bouquet-red', code: '1001066', kind: 'bouquet', dark: '#9b2434', main: '#d94f61', light: '#ffd8dd', background: '#fff5f7' },
  'woshe-round-hand-bouquet-pink': { slug: 'woshe-round-hand-bouquet-pink', code: '1001060', kind: 'bouquet', dark: '#c45f8d', main: '#ebb2c8', light: '#fde5ef', background: '#fff8fb' },
  'cream-pink-design': { slug: 'cream-pink-design', code: '1001047', kind: 'daily', dark: '#c79e84', main: '#e6b8c2', light: '#f9e6de', background: '#fff9f6' },
  'light-green-design': { slug: 'light-green-design', code: '1001039', kind: 'daily', dark: '#87ad77', main: '#cce0b8', light: '#eef7e4', background: '#fcfffb' },
  'pink-roses-pink-belle': { slug: 'pink-roses-pink-belle', code: '1001033', kind: 'box', dark: '#cc7398', main: '#efb7cb', light: '#fde6ef', background: '#fff9fb' },
  'maroon-belle': { slug: 'maroon-belle', code: '1001010', kind: 'box', dark: '#6b2537', main: '#a54a62', light: '#f0d0d8', background: '#fff7f9' }
};

export function getSeedProductImagePath(slug: string): string {
  return `${photoStyleSlugs.has(slug) ? photoImagePrefix : catalogImagePrefix}/${slug}`;
}

function flowers(item: SeedImageDescriptor): string {
  return `<circle cx="520" cy="440" r="66" fill="${item.main}"/><circle cx="590" cy="390" r="74" fill="${item.light}"/><circle cx="660" cy="415" r="68" fill="${item.main}"/><circle cx="710" cy="480" r="58" fill="${item.light}"/><circle cx="590" cy="500" r="54" fill="${item.background}"/>`;
}

function objectShape(item: SeedImageDescriptor): string {
  if (item.kind === 'bouquet') return `<path d="M470 560 L730 560 L650 840 Q600 890 550 840 Z" fill="white" opacity=".92"/><line x1="550" y1="560" x2="575" y2="835" stroke="#6d9865" stroke-width="8"/><line x1="640" y1="560" x2="620" y2="845" stroke="#6d9865" stroke-width="8"/>`;
  if (item.kind === 'pot') return `<path d="M470 595 H730 L690 840 H510 Z" fill="white" opacity=".94"/><rect x="500" y="580" width="200" height="24" rx="12" fill="${item.dark}" opacity=".18"/>`;
  if (item.kind === 'gift') return `<path d="M480 590 L730 590 L655 845 Q605 890 555 850 Z" fill="white" opacity=".94"/><circle cx="450" cy="730" r="52" fill="#c89166"/><circle cx="416" cy="700" r="22" fill="#c89166"/><circle cx="484" cy="700" r="22" fill="#c89166"/>`;
  if (item.kind === 'daily') return `<path d="M520 585 H680 L720 840 H480 Z" fill="white" opacity=".94"/><rect x="525" y="560" width="150" height="34" rx="17" fill="${item.dark}" opacity=".12"/>`;
  return `<rect x="405" y="540" rx="30" width="390" height="220" fill="white" opacity=".88"/><rect x="455" y="735" rx="24" width="290" height="70" fill="${item.dark}" opacity=".9"/>`;
}

function portraitClusters(item: SeedImageDescriptor): string {
  const blooms = [
    [410, 455, 96, item.main], [510, 365, 118, item.light], [640, 390, 128, item.main], [760, 470, 104, item.light],
    [500, 565, 92, item.background], [620, 575, 108, item.light], [725, 590, 82, item.main]
  ];
  return blooms.map(([cx, cy, r, fill]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity=".94"/>`).join('');
}

function renderPhotoObject(item: SeedImageDescriptor): string {
  if (item.kind === 'bouquet') return `<path d="M390 610 C475 740 530 930 600 1025 C680 925 735 735 812 610 Z" fill="#fffaf7" opacity=".96"/><path d="M470 675 C540 735 665 735 735 675 L675 960 Q600 1035 525 960 Z" fill="${item.main}" opacity=".18"/><rect x="500" y="775" width="200" height="42" rx="21" fill="${item.dark}" opacity=".58" transform="rotate(-8 600 796)"/>`;
  if (item.kind === 'pot') return `<path d="M405 660 H795 L735 1020 H465 Z" fill="#fffaf7" opacity=".96"/><rect x="445" y="635" width="310" height="44" rx="22" fill="${item.dark}" opacity=".2"/>`;
  return `<rect x="355" y="610" width="490" height="340" rx="42" fill="#fffaf7" opacity=".96"/><rect x="420" y="880" width="360" height="92" rx="30" fill="${item.dark}" opacity=".78"/>`;
}

export function renderSeedProductImageSvg(slug: string): string | null {
  const item = descriptors[slug];
  if (!item) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1400" viewBox="0 0 1200 1400"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${item.background}"/><stop offset="100%" stop-color="${item.light}"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="${item.dark}" flood-opacity=".18"/></filter></defs><rect width="1200" height="1400" fill="url(#bg)"/><circle cx="1060" cy="160" r="180" fill="white" opacity=".35"/><path d="M0 1180 C240 1080 360 1040 600 1120 C850 1200 980 1170 1200 1070 V1400 H0 Z" fill="white" opacity=".38"/><g filter="url(#shadow)"><rect x="70" y="72" width="1060" height="1256" rx="42" fill="white" opacity=".88"/></g><text x="92" y="132" fill="${item.dark}" font-size="28" font-family="Arial,Helvetica,sans-serif" letter-spacing="6" font-weight="700">GOLARA SEED CATALOG</text><text x="92" y="180" fill="${item.main}" font-size="24" font-family="Arial,Helvetica,sans-serif" font-weight="700">${item.kind.toUpperCase()}</text><ellipse cx="600" cy="930" rx="225" ry="28" fill="${item.dark}" opacity=".14"/>${flowers(item)}${objectShape(item)}<text x="92" y="1040" fill="#2f2a28" font-size="52" font-family="Georgia,serif" font-weight="700">${item.kind} arrangement</text><text x="92" y="1170" fill="${item.dark}" font-size="24" font-family="Arial,Helvetica,sans-serif" letter-spacing="4" font-weight="700">PRODUCT CODE</text><text x="92" y="1212" fill="#2f2a28" font-size="44" font-family="Arial,Helvetica,sans-serif" font-weight="700">${item.code}</text><text x="92" y="1280" fill="#6b625d" font-size="22" font-family="Arial,Helvetica,sans-serif">Original local placeholder artwork for seed data.</text></svg>`;
}

export function renderSeedProductPhotoSvg(slug: string): string | null {
  const item = descriptors[slug];
  if (!item || !photoStyleSlugs.has(slug)) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1400" viewBox="0 0 1200 1400"><defs><radialGradient id="glow" cx="50%" cy="36%" r="58%"><stop offset="0%" stop-color="${item.light}"/><stop offset="58%" stop-color="${item.background}"/><stop offset="100%" stop-color="${item.dark}" stop-opacity=".32"/></radialGradient><filter id="soft"><feGaussianBlur stdDeviation="14"/></filter><filter id="shadow"><feDropShadow dx="0" dy="34" stdDeviation="32" flood-color="${item.dark}" flood-opacity=".26"/></filter></defs><rect width="1200" height="1400" fill="url(#glow)"/><circle cx="190" cy="210" r="120" fill="#fff" opacity=".24" filter="url(#soft)"/><circle cx="1010" cy="260" r="170" fill="#fff" opacity=".2" filter="url(#soft)"/><circle cx="930" cy="1030" r="230" fill="${item.main}" opacity=".13" filter="url(#soft)"/><ellipse cx="600" cy="1085" rx="330" ry="62" fill="${item.dark}" opacity=".2" filter="url(#soft)"/><g filter="url(#shadow)">${portraitClusters(item)}${renderPhotoObject(item)}</g><rect x="88" y="94" width="1024" height="1212" rx="54" fill="none" stroke="#ffffff" stroke-opacity=".64" stroke-width="8"/><text x="105" y="1200" fill="${item.dark}" font-size="28" font-family="Arial,Helvetica,sans-serif" letter-spacing="5" font-weight="700">ORIGINAL GOLARA TEST IMAGE</text><text x="105" y="1254" fill="#403936" font-size="42" font-family="Arial,Helvetica,sans-serif" font-weight="700">${item.code}</text></svg>`;
}
