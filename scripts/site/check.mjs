#!/usr/bin/env node
// Checks the built _site: every internal link and asset resolves, every old Blogger URL still exists,
// and each indexable page has a title, description, canonical and one H1.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const OUT = '_site';
const files = [];
async function walk(d) { for (const e of await readdir(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? await walk(p) : files.push(p); } }
await walk(OUT);
const resolve = (u) => {
  const p = decodeURIComponent(u.split(/[?#]/)[0]);
  const f = path.join(OUT, p);
  if (p.endsWith('/')) return existsSync(path.join(f, 'index.html'));
  return existsSync(f) && statSync(f).isFile() || existsSync(path.join(f, 'index.html'));
};
const broken = new Map();
const problems = [];
for (const f of files.filter((x) => x.endsWith('.html'))) {
  const h = await readFile(f, 'utf8');
  const rel = '/' + path.relative(OUT, f).split(path.sep).join('/');
  for (const m of h.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)) {
    const u = m[1];
    if (!u.startsWith('/') || u.startsWith('//')) continue;
    if (!resolve(u)) (broken.get(u) || broken.set(u, new Set()).get(u)).add(rel);
  }
  if (/<meta name="robots" content="noindex, follow">|<meta name="robots" content="noindex">/.test(h) || /http-equiv="refresh"/.test(h) || rel.startsWith('/embed/')) continue;
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (!/<title>[^<]{10,}<\/title>/.test(h)) problems.push(`${rel}: title`);
  if (!/<meta name="description" content="[^"]{50,}"/.test(h)) problems.push(`${rel}: description`);
  if (!/<link rel="canonical"/.test(h)) problems.push(`${rel}: canonical`);
  if (h1 !== 1) problems.push(`${rel}: ${h1} H1`);
}
const exp = JSON.parse(await readFile('migration/export/blogger.json', 'utf8'));
const REMOVED = new Set(['/p/html-hook-builder.html']); // approved removal
const lost = exp.items.filter((x) => x.status === 'live' && x.path && !REMOVED.has(x.path) && !resolve(x.path)).map((x) => x.path);
console.log(`${files.length} files checked.`);
if (broken.size) console.log(`Broken internal links (${broken.size}):\n` + [...broken].slice(0, 40).map(([u, s]) => `  ${u}  ← ${[...s].slice(0, 3).join(', ')}${s.size > 3 ? ` +${s.size - 3}` : ''}`).join('\n'));
if (lost.length) console.log(`Old Blogger URLs missing: ${lost.join(', ')}`);
if (problems.length) console.log(`SEO basics (${problems.length}):\n  ` + problems.slice(0, 40).join('\n  '));
if (broken.size || lost.length || problems.length) process.exit(1);
console.log('All good.');
