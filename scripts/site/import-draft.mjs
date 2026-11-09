#!/usr/bin/env node
// Converts a Blogger-era draft (content/posts/<slug>.html) into a static article
// (site/content/articles/<slug>.html → /<slug>/) with draft: true, ready for review on the preview.
// Usage: node scripts/site/import-draft.mjs <slug> [<slug> …]
// Expects site/images/<slug>/<slug>.webp (scripts/site/graphics/featured.cjs makes it).
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const LABEL_HUB = { 'lawn care': 'lawn-care', vegetable: 'grow-food', 'garden maintenance': 'soil-compost', composting: 'soil-compost',
  'pest control': 'pests-weeds', 'garden design': 'garden-design', 'raised beds': 'garden-design', 'home improvement': 'home-diy', houseplants: 'houseplants' };
// Newer, more specific tools from the tools site, offered next to the quick answer.
const TOOL_CTA = {
  'how-much-grass-seed-do-i-need': ['/grass-seed-calculator/', 'Grass Seed Calculator', 'enter your lawn size and grass type to get pounds of seed for a new lawn or overseeding'],
  'when-to-overseed-lawn': ['/grass-seed-calculator/', 'Grass Seed Calculator', 'work out how much seed to buy for overseeding your lawn'],
  'how-to-measure-lawn-square-footage': ['/square-footage-calculator/', 'Square Footage Calculator', 'add up rectangles, triangles and circles to get your total lawn area'],
  'how-much-fertilizer-per-1000-sq-ft': ['/fertilizer-calculator/', 'Lawn Fertilizer Calculator', 'enter the N-P-K on your bag and your lawn size to get pounds of product'],
  'fertilizer-numbers-npk-explained': ['/fertilizer-calculator/', 'Lawn Fertilizer Calculator', 'turn the numbers on any bag into pounds of product for your lawn'],
  'when-to-fertilize-lawn': ['/fertilizer-calculator/', 'Lawn Fertilizer Calculator', 'find how much of your fertilizer to spread at each feeding'],
};
const now = new Date();
const stamp = `${now.toISOString().slice(0, 10)}T09:00:00+08:00`;

for (const slug of process.argv.slice(2)) {
  const src = readFileSync(`content/posts/${slug}.html`, 'utf8');
  const [, fm, raw] = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim() || '';
  const hub = LABEL_HUB[get('labels').split(',')[0].trim().toLowerCase()];
  if (!hub) throw new Error(`${slug}: no hub for label "${get('labels')}"; add it to LABEL_HUB`);
  const image = `/images/${slug}/${slug}.webp`;
  if (!existsSync(`site${image}`)) throw new Error(`${slug}: make the featured image first (site${image})`);
  const alt = (raw.match(/1\. FEATURED[\s\S]*?Alt:\s*(.+)/) || [])[1]?.trim();
  let body = raw.replace(/<!--\s*BEFORE PUBLISHING[\s\S]*?-->\n?/, '').trim();
  const cta = TOOL_CTA[slug];
  if (cta) body = body.replace(/(<div class="hgl-answer">[\s\S]*?<\/div>)/, `$1\n\n<div class="hgl-tool-cta">\n  <span>🧮</span>\n  <p><a href="${cta[0]}">Use the free ${cta[1]}</a>: ${cta[2]}.</p>\n</div>`);
  const front = [
    `title: ${get('title')}`, `description: ${get('description')}`, `date: ${stamp}`, `updated: ${stamp}`,
    `hub: ${hub}`, 'author: Fadzilla', `image: ${image}`, `imageAlt: ${alt ? `Illustration: ${alt.charAt(0).toLowerCase()}${alt.slice(1)}` : get('title')}`, 'draft: true',
  ].join('\n');
  mkdirSync('site/content/articles', { recursive: true });
  writeFileSync(`site/content/articles/${slug}.html`, `---\n${front}\n---\n${body}\n`);
  console.log(`site/content/articles/${slug}.html → /${slug}/ (${hub})`);
}
