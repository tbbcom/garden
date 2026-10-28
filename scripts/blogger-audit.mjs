#!/usr/bin/env node
// Read-only audit of the live blog: SEO, Google web standards and AdSense readiness.
// Never changes anything in Blogger. Writes reports/site-audit.md (+ the Actions job summary).
//
// Env: BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, BLOGGER_REFRESH_TOKEN, BLOGGER_BLOG_ID
// Usage: node scripts/blogger-audit.mjs
import { writeFile, appendFile, mkdir } from 'node:fs/promises';
import { api, accessToken, checkSecrets, sleep } from './lib/blogger-client.mjs';

const REPORT = 'reports/site-audit.md';
const THIN_WORDS = 700;
const ADSENSE_MIN_POSTS = 25;
const STALE_DAYS = 365;
const LINK_CHECK_LIMIT = 300;
const UA = 'Mozilla/5.0 (compatible; HGL-SiteAudit/1.0; +https://github.com/tbbcom/garden)';
// Pages AdSense reviewers and Google's quality raters look for, matched against page URLs/titles.
const REQUIRED_PAGES = {
  'About': /about/i,
  'Contact': /contact/i,
  'Privacy Policy': /privacy/i,
  'Disclaimer / Terms': /disclaimer|terms/i,
};

async function listAll(token, url) {
  const items = [];
  let pageToken = '';
  do {
    const data = await api(token, 'GET', url + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''));
    items.push(...(data.items || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return items;
}

const stripTags = (html) => html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ');
const words = (html) => stripTags(html).split(/\s+/).filter(Boolean).length;
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/\n/g, ' ');

function bodyIssues(post) {
  const html = post.content || '';
  const crit = [];
  const warn = [];
  const n = words(html);
  if (n < 300) crit.push(`thin content (${n} words)`);
  else if (n < THIN_WORDS) warn.push(`short (${n} words)`);

  const codes = [...new Set((stripTags(html).match(/\{(get[A-Za-z]+|inAds|ads|showAds|nextPage|contactForm|alert[A-Za-z]+|codeBox)\}/g) || []))];
  if (codes.length) warn.push(`old shortcodes as anchor/text: ${codes.join(' ')}`);
  if (/ADD YOUR EXPERIENCE/.test(html)) warn.push('experience line not added yet');
  if (/ADD YOUR PHOTO/.test(html)) warn.push('photo placeholder still in post');

  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  if (!imgs.length) crit.push('no image (no featured image for search, Discover and social)');
  const noAlt = imgs.filter((t) => !/\balt\s*=\s*(["'])\s*\S[^"']*\1/i.test(t)).length;
  if (noAlt) warn.push(`${noAlt} image(s) missing alt text`);
  if (imgs.some((t) => /\bsrc\s*=\s*["']http:\/\//i.test(t))) crit.push('image loaded over http:// (mixed content)');
  const lazyFirst = imgs[0] && /loading\s*=\s*["']lazy/i.test(imgs[0]);
  if (lazyFirst) warn.push('first image is lazy-loaded (slows LCP)');

  if (/<h1\b/i.test(html)) warn.push('extra <h1> in body (the title is already the H1)');
  if (!/<h2\b/i.test(html) && n >= 300) warn.push('no H2 subheadings');

  const labels = post.labels || [];
  if (labels.length !== 1) warn.push(labels.length ? `${labels.length} labels (use exactly one)` : 'no label');

  const t = post.title || '';
  if (!t.trim()) crit.push('empty title');
  else if (t.length > 65) warn.push(`title ${t.length} chars (may be cut in search; aim ≤ 65)`);

  return { words: n, crit, warn, html };
}

function internalLinks(html, host) {
  const out = new Set();
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["']/gi)) {
    const href = m[1].trim();
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    try {
      const u = new URL(href, `https://${host}/`);
      if (u.hostname.replace(/^www\./, '') === host.replace(/^www\./, '')) {
        u.hash = '';
        u.searchParams.delete('m');
        out.add(u.toString());
      }
    } catch { /* malformed href: reported via page check below */ }
  }
  return [...out];
}

async function fetchText(url, method = 'GET') {
  const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA } });
  return { status: res.status, url: res.url, text: method === 'GET' ? await res.text() : '' };
}

function pageIssues(html) {
  const crit = [];
  const warn = [];
  const meta = (name) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i'));
    return m ? (m[0].match(/content=["']([^"']*)["']/i) || [])[1] || '' : null;
  };
  const desc = meta('description');
  if (desc === null || !desc.trim()) warn.push('no meta description (fill "Search Description" in the post settings)');
  else if (desc.length < 70) warn.push(`meta description only ${desc.length} chars (aim 150–160)`);
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) crit.push('page is noindex');
  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) warn.push('no canonical link');
  const h1 = (html.match(/<h1\b/gi) || []).length;
  if (h1 !== 1) warn.push(`${h1} <h1> tags on the page (should be 1)`);
  if (meta('og:image') === null) warn.push('no og:image (no thumbnail on Facebook/Pinterest/Discover)');
  for (const block of html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || []) {
    const json = block.replace(/^<script[^>]*>|<\/script>$/gi, '');
    try { JSON.parse(json); } catch { crit.push('invalid JSON-LD structured data'); break; }
  }
  return { crit, warn };
}

async function checkLinks(urls) {
  const broken = new Map();
  const queue = urls.slice(0, LINK_CHECK_LIMIT);
  const worker = async () => {
    while (queue.length) {
      const u = queue.shift();
      try {
        let r = await fetchText(u, 'HEAD');
        if (r.status === 405 || r.status === 403) r = await fetchText(u, 'GET');
        if (r.status >= 400) broken.set(u, r.status);
      } catch (e) {
        broken.set(u, 'unreachable');
      }
      await sleep(200);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return broken;
}

async function main() {
  const blogBase = checkSecrets();
  const token = await accessToken();

  const blog = await api(token, 'GET', `${blogBase}?view=AUTHOR`);
  const host = new URL(blog.url).hostname;
  const fields = 'nextPageToken,items(id,title,url,labels,content,published,updated)';
  const live = await listAll(token, `${blogBase}/posts?status=live&view=AUTHOR&fetchBodies=true&maxResults=50&fields=${encodeURIComponent(fields)}`);
  const drafts = await listAll(token, `${blogBase}/posts?status=draft&view=AUTHOR&fetchBodies=false&maxResults=50&fields=${encodeURIComponent('nextPageToken,items(id,title,updated)')}`);
  const pages = await listAll(token, `${blogBase}/pages?status=live&view=AUTHOR&fetchBodies=false&fields=${encodeURIComponent('items(id,title,url)')}`);

  const rows = [];
  const allLinks = new Map(); // url -> [post titles linking to it]
  const titleCount = {};
  for (const p of live) titleCount[p.title.trim().toLowerCase()] = (titleCount[p.title.trim().toLowerCase()] || 0) + 1;

  for (const p of live) {
    const b = bodyIssues(p);
    const crit = [...b.crit];
    const warn = [...b.warn];
    if (titleCount[p.title.trim().toLowerCase()] > 1) crit.push('duplicate title');
    const ageDays = Math.round((Date.now() - new Date(p.updated).getTime()) / 864e5);
    if (ageDays > STALE_DAYS) warn.push(`not updated for ${ageDays} days (refresh candidate)`);
    try {
      const pg = await fetchText(p.url);
      if (pg.status >= 400) crit.push(`live URL returns ${pg.status}`);
      else {
        const pi = pageIssues(pg.text);
        crit.push(...pi.crit);
        warn.push(...pi.warn);
      }
    } catch {
      warn.push('could not fetch the live page');
    }
    for (const l of internalLinks(b.html, host)) {
      if (!allLinks.has(l)) allLinks.set(l, []);
      allLinks.get(l).push(p.title);
    }
    rows.push({ p, words: b.words, crit, warn });
    await sleep(300);
  }

  const broken = await checkLinks([...allLinks.keys()]);
  for (const [u, status] of broken) {
    for (const r of rows) if (allLinks.get(u).includes(r.p.title)) r.crit.push(`broken internal link (${status}): ${u.replace(/^https?:\/\/[^/]+/, '')}`);
  }

  // AdSense readiness
  const pageHas = Object.fromEntries(Object.entries(REQUIRED_PAGES).map(([k, re]) => [k, pages.some((pg) => re.test(pg.url) || re.test(pg.title))]));
  const substantial = rows.filter((r) => r.words >= THIN_WORDS).length;
  const withCrit = rows.filter((r) => r.crit.length).length;
  const unfinished = rows.filter((r) => r.warn.some((w) => /experience line|photo placeholder/.test(w))).length;
  const checks = [
    [`${ADSENSE_MIN_POSTS}+ substantial posts (≥ ${THIN_WORDS} words)`, substantial >= ADSENSE_MIN_POSTS, `${substantial} of ${live.length} live posts`],
    ...Object.entries(pageHas).map(([k, ok]) => [`${k} page published`, ok, ok ? 'found' : 'missing']),
    ['No posts with critical issues', withCrit === 0, `${withCrit} post(s) with critical issues`],
    ['Every post personalised (experience + real photo)', unfinished === 0, `${unfinished} post(s) still have placeholders`],
    ['No broken internal links', broken.size === 0, `${broken.size} broken link(s)`],
  ];
  const ready = checks.every((c) => c[1]);

  const labels = {};
  for (const p of live) for (const l of (p.labels && p.labels.length ? p.labels : ['(none)'])) labels[l] = (labels[l] || 0) + 1;

  const date = new Date().toISOString().slice(0, 10);
  const L = [];
  L.push(`# Site audit: ${blog.name || host}`, '', `_${date} · read-only check of ${live.length} live posts, ${drafts.length} drafts and ${pages.length} pages. Nothing in Blogger was changed._`, '');
  L.push(`## AdSense readiness: ${ready ? '✅ ready to apply' : '❌ not yet'}`, '', '| Check | Status | Detail |', '|---|---|---|');
  for (const [name, ok, detail] of checks) L.push(`| ${name} | ${ok ? '✅' : '❌'} | ${esc(detail)} |`);
  L.push('');

  const critRows = rows.filter((r) => r.crit.length);
  L.push(`## Critical (${critRows.length})`, '');
  if (!critRows.length) L.push('None. 🎉', '');
  for (const r of critRows) L.push(`- **[${esc(r.p.title)}](${r.p.url})**: ${r.crit.map(esc).join('; ')}`);
  if (critRows.length) L.push('');

  const warnRows = rows.filter((r) => r.warn.length);
  L.push(`## Improvements (${warnRows.length} posts)`, '');
  if (warnRows.length) {
    L.push('| Post | Words | To fix |', '|---|---|---|');
    for (const r of warnRows.sort((a, b) => b.warn.length - a.warn.length)) L.push(`| [${esc(r.p.title)}](${r.p.url}) | ${r.words} | ${r.warn.map(esc).join('<br>')} |`);
  } else L.push('Nothing to improve.');
  L.push('');

  L.push('## Labels', '', '| Label | Posts |', '|---|---|');
  for (const [l, c] of Object.entries(labels).sort((a, b) => b[1] - a[1])) L.push(`| ${esc(l)} | ${c} |`);
  L.push('', `## Drafts waiting (${drafts.length})`, '');
  for (const d of drafts.slice(0, 60)) L.push(`- ${esc(d.title || '(untitled)')}`);
  L.push('', '## Pages', '');
  for (const pg of pages) L.push(`- [${esc(pg.title)}](${pg.url})`);
  L.push('');

  const md = L.join('\n');
  await mkdir('reports', { recursive: true });
  await writeFile(REPORT, md);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, md);
  console.log(`Audit written to ${REPORT}: ${live.length} live, ${critRows.length} with critical issues, AdSense ready: ${ready}`);
}

main().catch((e) => {
  console.error(`::error::${e.message}`);
  process.exit(1);
});
