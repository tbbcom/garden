#!/usr/bin/env node
// Publishes drafts: moves site/drafts/{posts,articles,pages}/… over site/content/… (same relative path),
// stamping today's date as `updated` (and `date` for new articles). Usage:
//   node scripts/site/publish-drafts.mjs            → every draft
//   node scripts/site/publish-drafts.mjs pumpkins   → drafts whose path contains "pumpkins"
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const filter = process.argv.slice(2);
const now = new Date().toISOString().replace(/\.\d+Z$/, '+00:00');
async function walk(d) { const o = []; for (const e of await readdir(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? o.push(...(await walk(p))) : o.push(p); } return o; }

if (!existsSync('site/drafts')) { console.log('No drafts.'); process.exit(0); }
let n = 0;
for (const f of (await walk('site/drafts')).filter((x) => x.endsWith('.html'))) {
  if (filter.length && !filter.some((w) => f.includes(w))) continue;
  const rel = path.relative('site/drafts', f);
  const dest = path.join('site/content', rel);
  let s = await readFile(f, 'utf8');
  s = s.replace(/^updated: .*$/m, `updated: ${now}`).replace(/^draft: .*\n/m, '');
  if (!existsSync(dest) && rel.startsWith('articles/')) s = s.replace(/^date: .*$/m, `date: ${now}`);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, s);
  await rm(f);
  console.log(`published ${rel}${existsSync(dest) ? '' : ''}`);
  n++;
}
console.log(`${n} draft(s) published. Run the build, then commit.`);
