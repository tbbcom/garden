#!/usr/bin/env node
// Builds the migration URL map from the Blogger export and the tools sitemap.
// In:  migration/export/blogger.json, migration/export/tools-sitemap.xml
// Out: migration/URL-MAP.md (for review), migration/redirects.json (used by the static build)
import { readFile, writeFile } from 'node:fs/promises';

const WWW = 'https://www.homegardenlot.com';
const TOOLS = 'https://tools.homegardenlot.com';
const slug = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Tool-site pages that duplicate a blog page: send them to the blog version.
const TOOL_MERGE = {
  '/': '/tools/',
  '/about/': '/p/about.html',
  '/privacy/': '/p/privacy-policy.html',
  '/terms/': '/p/terms.html',
  '/contact/': '/p/contact.html',
  '/disclaimer/': '/p/disclaimer.html',
  '/editorial-policy/': '/p/editorial-policy.html',
};

const exp = JSON.parse(await readFile('migration/export/blogger.json', 'utf8'));
const toolsXml = await readFile('migration/export/tools-sitemap.xml', 'utf8').catch(() => '');
const toolPaths = [...toolsXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

const live = exp.items.filter((x) => x.status === 'live' && x.path);
const keep = live.map((x) => ({ from: x.path, to: x.path, kind: x.type, title: x.title, live: x.live, description: x.description }));
const rules = [];
const blogPaths = new Set(keep.map((k) => k.from));

// Blogger system URLs (patterns, applied in order by the edge).
rules.push(
  { from: '/search/label/:label', to: '/category/:label/', note: 'label pages → category pages (slugged)' },
  { from: '/search', to: '/search/', note: 'site search, query string kept' },
  { from: '/feeds/posts/default', to: '/feed.xml', note: 'Atom/RSS feed, any ?alt=' },
  { from: '/feeds/*', to: '/feed.xml', note: 'all other Blogger feeds' },
  { from: '/atom.xml', to: '/feed.xml' }, { from: '/rss.xml', to: '/feed.xml' },
  { from: '/sitemap-pages.xml', to: '/sitemap.xml' },
  { from: '/:yyyy/', to: '/', note: 'year archive (4 digits)' },
  { from: '/:yyyy/:mm/', to: '/', note: 'month archive' },
  { from: '*?m=1 / ?m=0', to: 'same path without ?m=', note: 'Blogger mobile parameter' },
);
const categories = exp.labels.map((l) => ({ label: l, path: `/category/${slug(l)}/` }));

// Tools: path-preserving 301 from the subdomain, except merged pages.
const toolMap = toolPaths.map((p) => {
  const to = TOOL_MERGE[p] || p;
  return { from: TOOLS + p, to: WWW + to, clash: !TOOL_MERGE[p] && (blogPaths.has(p) || p.startsWith('/p/') || p.startsWith('/search') || p.startsWith('/feeds') || /^\/\d{4}\//.test(p) || p.startsWith('/category/')) };
});
const clashes = toolMap.filter((t) => t.clash);

await writeFile('migration/redirects.json', JSON.stringify({ rules, categories, toolMerge: TOOL_MERGE, toolPaths }, null, 1) + '\n');

const drafts = exp.items.filter((x) => x.status !== 'live');
const missingDesc = keep.filter((k) => !k.description);
const unreadable = keep.filter((k) => k.live && ![200, 'skipped'].includes(k.live.status));
const images = [...new Set(exp.items.flatMap((x) => x.images))];
const md = [
  '# URL map: Blogger + tools subdomain → static www.homegardenlot.com',
  '',
  `Generated ${new Date().toISOString().slice(0, 10)} from the export of ${exp.exportedAt.slice(0, 10)}.`,
  '',
  '## Summary',
  '',
  `| | Count | What happens |`,
  `|---|---|---|`,
  `| Live posts | ${keep.filter((k) => k.kind === 'post').length} | **Same URL** (no redirect) |`,
  `| Live pages | ${keep.filter((k) => k.kind === 'page').length} | **Same URL** (no redirect) |`,
  `| Drafts / scheduled | ${drafts.length} | Kept as unpublished Markdown, not built |`,
  `| Labels → categories | ${categories.length} | \`/search/label/X\` → 301 → \`/category/x/\` |`,
  `| Tool pages | ${toolMap.length} | 301 \`tools.\` → same path on \`www.\` (except merged pages below) |`,
  `| Path clashes | ${clashes.length} | ${clashes.length ? '**needs a decision**' : 'none'} |`,
  `| Images in posts/pages | ${images.length} | Downloaded, converted to WebP, self-hosted |`,
  '',
  unreadable.length ? `**Live pages the export could not read (${unreadable.length}):** ${unreadable.map((u) => '`' + u.from + '`').join(', ')}\n` : '',
  missingDesc.length ? `**Live pages with no search description (${missingDesc.length}):** ${missingDesc.map((u) => '`' + u.from + '`').join(', ')}\n` : '',
  '## 1. Blog URLs that stay exactly the same',
  '',
  '| Path | Type | Title |',
  '|---|---|---|',
  ...keep.sort((a, b) => a.kind.localeCompare(b.kind) || a.from.localeCompare(b.from)).map((k) => `| \`${k.from}\` | ${k.kind} | ${k.title.replace(/\|/g, '\\|')} |`),
  '',
  '## 2. Blogger system URLs → 301',
  '',
  '| Old | New | Note |',
  '|---|---|---|',
  ...rules.map((r) => `| \`${r.from}\` | \`${r.to}\` | ${r.note || ''} |`),
  '',
  '### Categories',
  '',
  '| Label | New page |',
  '|---|---|',
  ...categories.map((c) => `| ${c.label} | \`${c.path}\` |`),
  '',
  '## 3. tools.homegardenlot.com → www (301)',
  '',
  'One rule: `tools.homegardenlot.com/*` → `www.homegardenlot.com/*` (path kept), with these exceptions:',
  '',
  '| Old (tools.) | New (www.) |',
  '|---|---|',
  ...Object.entries(TOOL_MERGE).filter(([p]) => toolPaths.includes(p)).map(([p, to]) => `| \`${p}\` | \`${to}\` |`),
  '',
  clashes.length ? '**Clashes (a tool path equals a blog path):**\n\n' + clashes.map((c) => `- \`${c.from}\``).join('\n') + '\n' : '',
  `<details><summary>All ${toolMap.length} tool URLs</summary>\n\n` + toolMap.map((t) => `- \`${new URL(t.from).pathname}\` → \`${new URL(t.to).pathname}\``).join('\n') + '\n\n</details>',
  '',
  '## 4. Drafts and scheduled posts (not published)',
  '',
  ...drafts.map((d) => `- ${d.status}: ${d.title}`),
  '',
].join('\n');
await writeFile('migration/URL-MAP.md', md);
console.log(`URL map: ${keep.length} kept, ${rules.length} rules, ${categories.length} categories, ${toolMap.length} tool URLs, ${clashes.length} clashes.`);
