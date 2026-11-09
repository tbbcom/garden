#!/usr/bin/env node
// One-off: turns migration/export/blogger.json into the static site's source files.
//   site/content/posts/YYYY/MM/slug.html  and  site/content/pages/slug.html
// Each file: front matter (--- key: value ---) + the Blogger post HTML, unchanged.
// Re-running overwrites; after the switch to static, these files are the source of truth.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Pages dropped in the migration (redirected or removed; see migration/URL-MAP.md).
const SKIP = new Set(['/p/html-hook-builder.html', '/p/contact-us.html']);

// Hub per post slug (approved: 96 Blogger labels → topic hubs).
const HUB = {
  'grow-food': ['how-to-grow-carrots', 'how-to-grow-tomatoes', 'how-to-grow-kohlrabi', 'how-to-grow-cucumbers', 'how-to-grow-radishes', 'how-to-grow-garlic',
    'how-to-grow-broccoli', 'how-to-grow-cabbage', 'grow-sweet-potatoes', 'how-to-grow-okra', 'how-to-grow-strawberry', 'how-to-grow-brussels-sprouts',
    'how-to-grow-ginger-at-home', 'how-to-grow-curry-leaf', 'how-to-grow-dragon-fruit', 'how-to-grow-okra-from-seeds-to-harvest', 'how-to-grow-potatoes',
    'how-to-grow-pumpkins', 'how-to-grow-strawberries', 'how-to-grow-and-care-for-banana-plant', 'how-to-grow-watermelon', 'easiest-vegetables-for-beginners'],
  'garden-design': ['vegetable-garden-ideas', 'small-garden-design-ideas', 'gardening-for-beginners', 'outdoor-growing-space-how-to-grow',
    'how-to-build-raised-bed-garden', 'what-to-plant-in-november', 'patio-outdoor-furniture-guide'],
  'soil-compost': ['how-to-compost-kitchen-scraps', 'how-to-make-compost-to-feed-your-plants'],
  'pests-weeds': ['natural-pest-control-garden', 'how-to-kill-weeds-naturally', 'how-to-get-rid-of-ants', 'how-to-get-rid-of-lizards', '8-genius-tricks-to-get-rid-of-flies'],
  houseplants: ['best-indoor-hanging-plants', 'best-indoor-plants'],
  'home-diy': ['peel-and-stick-wallpaper-renters-guide', 'cost-to-floor-1000-sq-ft', 'how-to-paint-kitchen-cabinets', 'how-to-hang-art', 'sustainable-home-decor-brands', 'decor-trends'],
};
const hubOf = Object.fromEntries(Object.entries(HUB).flatMap(([h, slugs]) => slugs.map((s) => [s, h])));

const one = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const exp = JSON.parse(await readFile('migration/export/blogger.json', 'utf8'));
let n = 0;
const missing = [];
for (const it of exp.items.filter((x) => x.status === 'live' && x.path && !SKIP.has(x.path))) {
  const slug = path.basename(it.path, '.html');
  const hub = it.type === 'post' ? hubOf[slug] : '';
  if (it.type === 'post' && !hub) missing.push(slug);
  const image = it.live?.ogImage || it.images.find((u) => /^https?:\/\//.test(u) && !/ytimg/.test(u)) || '';
  const meta = {
    title: one(it.title), description: one(it.description), date: it.published, updated: it.updated,
    hub, labels: it.labels.join(', '), image, author: one(it.author), bloggerId: it.id,
  };
  const fm = Object.entries(meta).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}: ${v}`).join('\n');
  const file = it.type === 'post' ? `site/content/posts${path.dirname(it.path)}/${slug}.html` : `site/content/pages/${slug}.html`;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `---\n${fm}\n---\n${it.content.trim()}\n`);
  n++;
}
if (missing.length) throw new Error(`Posts with no hub: ${missing.join(', ')}`);
console.log(`Wrote ${n} files to site/content/.`);
