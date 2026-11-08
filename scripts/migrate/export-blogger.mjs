#!/usr/bin/env node
// Read-only export of every Blogger post and page (live, draft, scheduled) for the static migration.
// Never writes to Blogger. Output: migration/export/blogger.json
// Env: BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, BLOGGER_REFRESH_TOKEN, BLOGGER_BLOG_ID
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { api, accessToken, checkSecrets, sleep } from '../lib/blogger-client.mjs';

const SITE = 'https://www.homegardenlot.com';
const OUT = 'migration/export/blogger.json';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

async function listAll(base, token, kind) {
  const out = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({ fetchBodies: 'true', view: 'ADMIN' });
    if (kind === 'posts') q.set('maxResults', '500');
    for (const s of kind === 'posts' ? ['live', 'draft', 'scheduled'] : ['live', 'draft']) q.append('status', s);
    if (pageToken) q.set('pageToken', pageToken);
    const j = await api(token, 'GET', `${base}/${kind}?${q}`);
    out.push(...(j.items || []));
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return out;
}

const attr = (html, re) => (html.match(re) || [])[1]?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() || '';

// The search description and featured image aren't in the API, so read them from the live page.
// Google answers bursts with a 302 to /sorry: one try per page, and stop reading live pages once blocked.
let blocked = false;
async function liveMeta(url) {
  if (blocked) return { status: 'skipped' };
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (res.status !== 200) {
      if (res.status === 302 && /sorry/.test(res.headers.get('location') || '')) blocked = true;
      return { status: res.status };
    }
    const h = await res.text();
    return {
      status: 200,
      description: attr(h, /<meta\s+name=['"]description['"]\s+content=['"]([^'"]*)['"]/i) || attr(h, /<meta\s+content=['"]([^'"]*)['"]\s+name=['"]description['"]/i),
      ogImage: attr(h, /<meta\s+property=['"]og:image['"]\s+content=['"]([^'"]*)['"]/i) || attr(h, /<meta\s+content=['"]([^'"]*)['"]\s+property=['"]og:image['"]/i),
    };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

// Fallback descriptions from the repo's post sources (front matter "description:").
async function repoDescriptions() {
  const out = {};
  for (const n of (await readdir('content/posts').catch(() => [])).filter((f) => f.endsWith('.html'))) {
    const m = (await readFile(`content/posts/${n}`, 'utf8')).match(/^---[\s\S]*?^description:\s*(.+)$/m);
    if (m) out[n.replace(/\.html$/, '')] = m[1].trim();
  }
  return out;
}

function slim(x, type) {
  const images = [...new Set([...(x.content || '').matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]))];
  return {
    type, id: x.id, status: (x.status || 'LIVE').toLowerCase(), title: x.title, url: x.url || '',
    path: x.url ? new URL(x.url).pathname : '', published: x.published, updated: x.updated,
    labels: x.labels || [], author: x.author?.displayName || '', replies: Number(x.replies?.totalItems || 0),
    images, content: x.content || '',
  };
}

async function main() {
  const base = checkSecrets();
  const token = await accessToken();
  const posts = (await listAll(base, token, 'posts')).map((p) => slim(p, 'post'));
  const pages = (await listAll(base, token, 'pages')).map((p) => slim(p, 'page'));
  const items = [...posts, ...pages];
  console.log(`Exported ${posts.length} posts and ${pages.length} pages.`);
  const repo = await repoDescriptions();
  let n = 0;
  for (const it of items.filter((x) => x.status === 'live' && x.url)) {
    it.live = await liveMeta(it.url.replace(/^http:/, 'https:'));
    const key = it.path.split('/').pop().replace(/\.html$/, '');
    it.description = it.live.description || repo[key] || '';
    it.descriptionSource = it.live.description ? 'live' : repo[key] ? 'repo' : 'none';
    if (++n % 10 === 0) console.log(`  read ${n} live pages${blocked ? ' (Google rate limit hit; using repo descriptions)' : ''}`);
    if (!blocked) await sleep(3000);
  }
  const labels = [...new Set(posts.filter((p) => p.status === 'live').flatMap((p) => p.labels))].sort();
  await mkdir('migration/export', { recursive: true });
  await writeFile(OUT, JSON.stringify({ site: SITE, exportedAt: new Date().toISOString(), labels, items }, null, 1) + '\n');
  const bad = items.filter((x) => x.live && x.live.status !== 200 && x.live.status !== 'skipped');
  console.log(`Wrote ${OUT}. Live pages not readable: ${bad.length}${bad.length ? ' → ' + bad.map((b) => b.path).join(', ') : ''}`);
}

main().catch((e) => { console.error(`::error::${e.message}`); process.exit(1); });
