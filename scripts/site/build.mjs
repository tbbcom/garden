#!/usr/bin/env node
// Builds the static www.homegardenlot.com: blog posts and pages (same URLs as Blogger),
// topic hubs, archives, search, feed and sitemap, merged with the tools site build.
//
// Env: SITE_URL    canonical origin (default https://www.homegardenlot.com)
//      TOOLS_DIR   path to the garden-calc build output (_site); tools are skipped when unset
//      PREVIEW=1   noindex every page and disallow crawling (preview host)
//      GTM_ID      GTM-XXXX or G-XXXX (same rules as the tools site)
//      WEB3FORMS_KEY  public access key for the contact form (web3forms.com, free)
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { imageSize } from 'image-size';

const SITE = (process.env.SITE_URL || 'https://www.homegardenlot.com').replace(/\/$/, '');
const TOOLS_HOST = 'https://tools.homegardenlot.com';
const PREVIEW = process.env.PREVIEW === '1';
const TOOLS_DIR = process.env.TOOLS_DIR || '';
const GTM_RAW = (process.env.GTM_ID || '').trim().toUpperCase();
const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/.test(GTM_RAW) ? GTM_RAW : '';
const GA4_ID = /^G-[A-Z0-9]{6,14}$/.test(GTM_RAW) ? GTM_RAW : '';
const WEB3FORMS_KEY = /^[a-f0-9-]{20,60}$/i.test((process.env.WEB3FORMS_KEY || '').trim()) ? process.env.WEB3FORMS_KEY.trim() : '';
const OUT = '_site';
const BRAND = 'Home Garden Lot';
const THEME = 'blogger/homegardenlot-theme.xml';
const ORG_ID = `${SITE}/#organization`;
const SITE_ID = `${SITE}/#website`;
const LOGO = 'https://blogger.googleusercontent.com/img/a/AVvXsEjoJpzMbdp1wYSHq9FW-psCak7EAnomwXHFP0PLmjO9oj7qYViGtHMvMQaROVdxWLXHulSUqRJ0PGqg8Kj82uquNfFDDssLYe8ZIQdMgD_004eTkwwXpuU5h0T2k5MOgQ1J6aDfIwToU3XmkKTSIw2ASFhZ-sJhzeYnzqMQdiNcLXZFZ1B2vg2o1--ECfdrY=s150';
const SAME_AS = ['https://www.pinterest.com/gardenlot/', 'https://www.facebook.com/gardenlot', 'https://twitter.com/garden_lot', 'https://bsky.app/profile/gardenlot.bsky.social', 'https://www.youtube.com/gardenlot'];
const CONSENT_REGIONS = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'];

export const HUBS = [
  ['grow-food', 'Grow Food', 'Step-by-step guides to growing vegetables, fruit and herbs at home, from seed to harvest.'],
  ['garden-design', 'Garden Design & Planning', 'Layouts, raised beds, small-space ideas and seasonal planning for a garden that works.'],
  ['lawn-care', 'Lawn Care', 'Fertilizing, watering, seeding and mowing schedules for a thick, healthy lawn, with free calculators.'],
  ['soil-compost', 'Soil & Compost', 'Build healthy soil: composting, soil mixes and amendments explained simply.'],
  ['pests-weeds', 'Pests & Weeds', 'Safe, practical ways to control garden pests, household pests and weeds.'],
  ['houseplants', 'Houseplants', 'Choosing and caring for indoor plants in every room and light level.'],
  ['home-diy', 'Home & DIY', 'Practical home improvement and decor: flooring, painting, wall art and budget upgrades.'],
];
const liveHubs = () => HUBS.filter(([s]) => POSTS.some((p) => p.hub === s));
const HUB = Object.fromEntries(HUBS.map(([s, n, d]) => [s, { slug: s, name: n, desc: d, url: `/category/${s}/` }]));

import { MOVED, TOOL_MERGE, DEAD } from './redirect-map.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const slugify = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const isoDay = (iso) => new Date(iso).toISOString().slice(0, 10);

// Blogger image URLs can be resized by rewriting their size token.
const abs = (u) => (u && u.startsWith('/') ? `${SITE}${u}` : u);
function resize(url, w, h) {
  if ((url || '').startsWith('/')) return url;
  if (!/googleusercontent\.com|bp\.blogspot\.com/.test(url || '')) return url || '';
  const tok = h ? `w${w}-h${h}-p-k-no-nu` : `w${w}`;
  if (/\/s\d+(-[a-z0-9-]+)?\//.test(url) || /\/w\d+-h\d+[^/]*\//.test(url)) return url.replace(/\/(s\d+|w\d+-h\d+)(-[a-z0-9-]+)?\//, `/${tok}/`);
  if (/=[swh]\d+[^/]*$/.test(url)) return url.replace(/=[swh]\d+[^/]*$/, `=${tok}`);
  if (/\/img\/a\//.test(url)) return `${url}=${tok}`;
  return url;
}

function parseFile(raw, file) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { ...meta, html: m[2] };
}

async function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function write(rel, content) {
  const file = path.join(OUT, rel.endsWith('/') ? `${rel}index.html` : rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

// ---------- Theme pieces (the Blogger theme stays the single source of the design) ----------
const themeXml = await readFile(THEME, 'utf8');
const THEME_CSS = themeXml.match(/<b:skin[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/b:skin>/)[1].replace(/body#layout[^{]*\{[^}]*\}/g, '').trim();
// Additions for static-only content (figures with captions); the rest of the design is the theme's.
const EXTRA_CSS = '.hgl-author{grid-template-columns:1fr;justify-items:center;text-align:center;padding:28px 24px}.hgl-author__img{width:88px;height:88px;border:3px solid var(--hgl-green-soft);background:#fff}.hgl-author__links{justify-content:center}.hgl-author__name{font-weight:700}.hgl-cf{max-width:640px;gap:16px;background:var(--hgl-surface);border:1px solid var(--hgl-line);border-top:4px solid var(--hgl-green);border-radius:var(--hgl-radius);padding:24px;box-shadow:var(--hgl-shadow)}.hgl-cf__head{margin-bottom:4px}.hgl-cf__title{margin:0;font-size:1.25rem;font-weight:700;color:var(--hgl-text)}.hgl-cf__sub{margin:.2em 0 0;color:var(--hgl-muted);font-size:.95rem}.hgl-cf__row{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media (max-width:560px){.hgl-cf__row{grid-template-columns:1fr}.hgl-cf{padding:18px}}.hgl-cf__field{display:grid;gap:6px}.hgl-cf__field label{font-weight:600;font-size:.92rem;color:var(--hgl-text-2)}.hgl-cf__field label span{color:#b42318}.hgl-cf__input{background:var(--hgl-gray)}.hgl-cf__input:focus{background:#fff;outline:2px solid var(--hgl-green);outline-offset:0}.hgl-cf textarea{resize:vertical;min-height:140px}.hgl-cf__privacy{margin:0;font-size:.85rem;color:var(--hgl-muted)}.hgl-cf .hgl-cf__btn{justify-self:stretch;padding:14px;font-size:1rem}.hgl-cf__btn[disabled]{opacity:.7;cursor:progress}.hgl-cf__status{margin:0;font-size:.92rem;min-height:1.2em}.hgl-cf__status--err{color:#b42318}.hgl-cf__done{text-align:center;padding:12px 4px}.hgl-cf__done h2{margin:.2em 0 .4em;font-size:1.3rem}.hgl-cf__done p{margin:0;color:var(--hgl-muted)}.hgl-cf__done svg{width:48px;height:48px;color:var(--hgl-green)}.hgl-figure{margin:1.6em 0}.hgl-figure img{display:block;width:100%;height:auto;border-radius:var(--hgl-radius);border:1px solid var(--hgl-line)}.hgl-figure figcaption{font-size:.88rem;color:var(--hgl-muted);margin-top:.5em}.hgl-post__body img{max-width:100%;height:auto}.hgl-post__body>img{display:block;margin:0 auto 1.4em}';
// Brand icons (site/root, from the Home Garden Lot logo) for every page, blog and tools.
const ICON_LINKS = '<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/manifest.webmanifest">';
// Static pages are safe to prerender: Chrome loads the next page on hover/press, so clicks feel instant.
const SPECULATION = '<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":["/search/*","/*.xml","/*.json"]}}]},"eagerness":"moderate"}]}</script>';
// Author photo: site/images/author.webp when you add one, otherwise the site logo.
const AUTHOR_PHOTO = existsSync('site/images/author.webp') ? '/images/author.webp' : '/icon-192.png';
const SPRITE = themeXml.match(/<svg aria-hidden='true' height='0'[\s\S]*?<\/svg>/)[0];
const SHARE_ICONS = [...themeXml.matchAll(/<button aria-label='[^']*' class='hgl-share__icon[\s\S]*?<\/button>/g)].map((m) => m[0]).join('\n');
const HEADER_LOGO = themeXml.match(/<img class='hgl-brand__logo'[^>]*\/>/)[0].replace(/expr:alt='[^']*'/, `alt='${BRAND}'`).replace(/\/>$/, '>');
const FOOTER_LOGO = themeXml.match(/<img alt='' class='hgl-footer__logo'[^>]*\/>/)[0].replace(/\/>$/, '>');

// Header/footer-only rules, for tool pages that keep their own body styles.
function shellCss(css) {
  const keep = /^(:root|\.hgl-(header|brand|nav|search|burger|footer|social|sr|wrap|widget__title|skip))/;
  const out = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const sel = css.slice(i, open).trim();
    if (sel.startsWith('@media')) {
      let depth = 1, j = open + 1;
      while (depth && j < css.length) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      const inner = shellCss(css.slice(open + 1, j - 1));
      if (inner) out.push(`${sel}{${inner}}`);
      i = j;
    } else {
      const close = css.indexOf('}', open);
      const sels = sel.replace(/\/\*[\s\S]*?\*\//g, '').split(',').map((s) => s.trim()).filter(Boolean);
      if (sels.length && sels.every((s) => keep.test(s))) out.push(`${sels.join(',')}${css.slice(open, close + 1)}`);
      i = close + 1;
    }
  }
  return out.join('\n');
}
const SHELL_CSS = shellCss(THEME_CSS.replace(/\/\*[\s\S]*?\*\//g, ''));

const TOOL_LINKS = [
  ['/frost-dates/', 'Frost Dates by ZIP'],
  ['/p/planting-calendar.html', 'Planting Calendar by ZIP'],
  ['/hardiness-zones/', 'Hardiness Zone by ZIP'],
  ['/p/garden-calculator.html', 'Garden Calculator (all-in-one)'],
  ['/p/mulch-calculator.html', 'Mulch Calculator'],
  ['/p/soil-calculator.html', 'Soil Calculator'],
  ['/raised-bed-soil-calculator/', 'Raised Bed Soil Calculator'],
  ['/gravel-calculator/', 'Gravel Calculator'],
  ['/fertilizer-calculator/', 'Lawn Fertilizer Calculator'],
  ['/paver-calculator/', 'Paver Calculator'],
  ['/p/flooring-calculator.html', 'Flooring Calculator'],
];

function gtmHead() {
  if (!GTM_ID && !GA4_ID) return '';
  const src = GTM_ID ? `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}` : `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  const boot = GTM_ID ? `dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});` : `window.hgtGA4=1;gtag('js',new Date());gtag('config','${GA4_ID}');`;
  return `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:${JSON.stringify(CONSENT_REGIONS)},wait_for_update:500});
gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});
gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);
${boot}
(function(){function l(){var s=document.createElement('script');s.async=true;s.src='${src}';document.head.appendChild(s);}
function q(){'requestIdleCallback' in window?requestIdleCallback(l,{timeout:2500}):setTimeout(l,200);}
document.readyState==='complete'?q():addEventListener('load',q);})();</script>`;
}

function headerHtml(isHome) {
  const tag = isHome ? 'h1' : 'div';
  return `<a class="hgl-skip" href="#hgl-main">Skip to content</a>
<header class="hgl-header">
  <div class="hgl-wrap hgl-header__bar">
    <${tag} class="hgl-brand-wrap"><a class="hgl-brand" href="/" rel="home">${HEADER_LOGO}<span class="hgl-sr">${BRAND}: Garden &amp; Home Improvement</span></a></${tag}>
    <form action="/search/" class="hgl-search" method="get" role="search"><label class="hgl-sr" for="hgl-q">Search this site</label><input class="hgl-search__input" id="hgl-q" name="q" placeholder="Search guides…" type="search"><button aria-label="Search" class="hgl-search__btn" type="submit">Go</button></form>
    <button aria-controls="hgl-nav" aria-expanded="false" aria-label="Open menu" class="hgl-nav__toggle" type="button"><span class="hgl-burger" aria-hidden="true"><span></span><span></span><span></span></span></button>
    <nav aria-label="Main" class="hgl-nav" id="hgl-nav">
      <ul class="hgl-nav__list">
        <li><a class="hgl-nav__link" href="/category/grow-food/">Grow Food</a></li>
        ${POSTS.some((p) => p.hub === 'lawn-care') ? '<li><a class="hgl-nav__link" href="/category/lawn-care/">Lawn Care</a></li>' : ''}
        <li><a class="hgl-nav__link" href="/category/garden-design/">Garden Design</a></li>
        <li><a class="hgl-nav__link" href="/category/pests-weeds/">Pests &amp; Weeds</a></li>
        <li><a class="hgl-nav__link" href="/category/home-diy/">Home &amp; DIY</a></li>
        <li class="hgl-nav__item--drop"><a class="hgl-nav__link" href="/tools/">Tools</a><button aria-expanded="false" aria-label="Show tools" class="hgl-nav__subtoggle" type="button"></button>
          <ul class="hgl-nav__sub">${TOOL_LINKS.map(([u, n]) => `<li><a href="${u}">${esc(n)}</a></li>`).join('')}<li><a href="/tools/">All free tools →</a></li></ul>
        </li>
      </ul>
      <form action="/search/" class="hgl-search" method="get" role="search"><label class="hgl-sr" for="hgl-q2">Search this site</label><input class="hgl-search__input" id="hgl-q2" name="q" placeholder="Search guides…" type="search"><button aria-label="Search" class="hgl-search__btn" type="submit">Go</button></form>
    </nav>
  </div>
</header>`;
}

const SOCIAL = [
  ['Facebook', 'facebook', 'https://www.facebook.com/gardenlot'],
  ['X (Twitter)', 'x', 'https://x.com/garden_lot'],
  ['Pinterest', 'pinterest', 'https://www.pinterest.com/gardenlot/'],
  ['YouTube', 'youtube', 'https://www.youtube.com/gardenlot'],
  ['Bluesky', 'bluesky', 'https://bsky.app/profile/gardenlot.bsky.social'],
];

function footerHtml() {
  return `<footer class="hgl-footer">
  ${SPRITE}
  <div class="hgl-footer__grid">
    <div class="hgl-footer__about">
      <div class="hgl-html">${FOOTER_LOGO}
        <h2 class="hgl-widget__title">About ${BRAND}</h2>
        <p>Practical, tested guides for growing food, caring for lawns and plants, and improving your home on a budget. Independent, reader-supported and fact-checked against university extension research.</p>
      </div>
      <h2 class="hgl-widget__title">Follow Us</h2>
      <p class="hgl-footer__text">Seasonal planting reminders, new calculators and how-to pins. Free, every week.</p>
      <ul aria-label="${BRAND} on social media" class="hgl-social">
        ${SOCIAL.map(([n, k, u]) => `<li><a aria-label="${esc(n)}" class="hgl-social__link hgl-social__link--${k}" href="${u}" rel="me noopener" target="_blank"><svg aria-hidden="true"><use href="#hgl-i-${k}"/></svg></a></li>`).join('\n        ')}
        <li><a aria-label="RSS feed" class="hgl-social__link hgl-social__link--rss" href="/feed.xml"><svg aria-hidden="true"><use href="#hgl-i-rss"/></svg></a></li>
      </ul>
    </div>
    <div class="hgl-footer__tools">
      <h2 class="hgl-widget__title">Free Garden Tools</h2>
      <ul class="hgl-footer__list">${TOOL_LINKS.slice(0, 7).map(([u, n]) => `<li><a href="${u}">${esc(n)}</a></li>`).join('')}<li><a href="/tools/">All tools →</a></li></ul>
    </div>
    <div class="hgl-footer__links">
      <h2 class="hgl-widget__title">Company</h2>
      <ul class="hgl-footer__list">
        <li><a href="/p/about.html">About &amp; Author</a></li>
        <li><a href="/p/contact.html">Contact</a></li>
        <li><a href="/p/editorial-policy.html">Editorial Policy</a></li>
        <li><a href="/p/privacy-policy.html">Privacy Policy</a></li>
        <li><a href="/p/terms-of-service.html">Terms of Use</a></li>
        <li><a href="/p/disclaimer.html">Disclaimer &amp; Affiliate Disclosure</a></li>
        <li><a href="/p/sitemap.html">Sitemap</a></li>
      </ul>
    </div>
  </div>
  <div class="hgl-footer__bottom">© ${new Date().getUTCFullYear()} <a href="/">${BRAND}</a>. All rights reserved. Content is for general information; always check local codes and product labels.
    <a class="hgl-footer__top" href="#">Back to top ↑</a></div>
</footer>`;
}

const ORG_GRAPH = [
  { '@type': 'Organization', '@id': ORG_ID, name: BRAND, url: `${SITE}/`, logo: { '@type': 'ImageObject', url: LOGO }, sameAs: SAME_AS },
  { '@type': 'WebSite', '@id': SITE_ID, name: BRAND, url: `${SITE}/`, inLanguage: 'en-US', publisher: { '@id': ORG_ID },
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/search/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' } },
];

function shell({ url, title, description, body, bodyClass = 'hgl-body hgl-body--list', image = '', type = 'website', graph = [], noindex = false, isHome = false, hero = '', sidebar = true, extraHead = '' }) {
  const robots = noindex ? 'noindex, follow' : PREVIEW ? 'noindex, follow" data-preview="1' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const ogImg = image ? abs(resize(image, 1200, 630)) : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${url}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#247b49">
<meta name="msvalidate.01" content="BA847386016785373262DF6A5B6B8F30">
<meta property="fb:app_id" content="966242223397117">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${url}">
${ogImg ? `<meta property="og:image" content="${esc(ogImg)}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:image" content="${esc(ogImg)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="alternate" type="application/atom+xml" title="${BRAND}" href="/feed.xml">
${ICON_LINKS}
${SPECULATION}
<link rel="preconnect" href="https://blogger.googleusercontent.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;display=swap" media="print" onload="this.media='all'">
<style>${THEME_CSS}
${EXTRA_CSS}</style>
${extraHead}
${gtmHead()}
${jsonLd({ '@context': 'https://schema.org', '@graph': [...ORG_GRAPH, ...graph] })}
</head>
<body class="${bodyClass}">
${headerHtml(isHome)}
${hero}
<div class="hgl-layout">
  <main class="hgl-main" id="hgl-main">
${body}
  </main>
${sidebar ? sidebarHtml() : ''}
</div>
${footerHtml()}
<script src="/assets/hgl.js" defer></script>
</body>
</html>
`;
}

let POSTS = [];
function sidebarHtml() {
  const latest = POSTS.slice(0, 5);
  return `  <aside aria-label="Sidebar" class="hgl-sidebar">
    <div class="hgl-box hgl-html">
      <h2 class="hgl-widget__title">Free Garden Calculators</h2>
      <p>Exact quantities for your project — free, no sign-up.</p>
      <ul class="hgl-tools">${TOOL_LINKS.map(([u, n]) => `<li><a href="${u}">${esc(n)}</a></li>`).join('')}</ul>
      <p><a class="hgl-btn" href="/tools/">All tools →</a></p>
    </div>
    <div class="hgl-box">
      <h2 class="hgl-widget__title">Latest Guides</h2>
      <ol class="hgl-pop">${latest.map((p) => `<li class="hgl-pop__item">${p.image ? `<img class="hgl-pop__img" alt="" src="${esc(resize(p.image, 144, 108))}" width="72" height="54" loading="lazy" decoding="async">` : '<span aria-hidden="true" class="hgl-pop__img"></span>'}<a class="hgl-pop__link" href="${p.url}">${esc(p.title)}</a></li>`).join('')}</ol>
    </div>
    <nav aria-label="Topics" class="hgl-box">
      <h2 class="hgl-widget__title">Browse Topics</h2>
      <ul class="hgl-labels">${liveHubs().map(([s, n]) => `<li><a class="hgl-chip" href="/category/${s}/">${esc(n)}<span class="hgl-labels__count">${POSTS.filter((p) => p.hub === s).length}</span></a></li>`).join('')}</ul>
    </nav>
  </aside>`;
}

// ---------- Content ----------
// Contact form: sent in the background to Web3Forms (free; delivers to the inbox set up there), so the
// reader stays on the page. Email Routing isn't used because the domain's mail runs on Zoho.
const TOPICS = [['general', 'General question'], ['correction', 'Correction or error report'], ['garden', 'Gardening question'],
  ['tool', 'Tool idea or feedback'], ['data', 'Using our data or embeds'], ['partnership', 'Advertising or partnership'], ['privacy', 'Privacy request']];
const contactForm = () => WEB3FORMS_KEY
  ? `<form class="hgl-cf" data-contact action="https://api.web3forms.com/submit" method="post" novalidate>
  <div class="hgl-cf__head"><p class="hgl-cf__title">Send us a message</p><p class="hgl-cf__sub">We read every message and reply within 3 business days.</p></div>
  <input type="hidden" name="access_key" value="${WEB3FORMS_KEY}">
  <input type="hidden" name="subject" value="[${BRAND}] New message">
  <input type="hidden" name="from_name" value="${BRAND} contact form">
  <input type="hidden" name="redirect" value="${SITE}/p/contact.html?sent=1">
  <input type="hidden" name="t" value="">
  <input type="checkbox" name="botcheck" class="hgl-sr" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="hgl-cf__row">
    <div class="hgl-cf__field"><label for="cf-name">Your name</label><input class="hgl-cf__input" id="cf-name" name="name" required minlength="2" maxlength="100" autocomplete="name"></div>
    <div class="hgl-cf__field"><label for="cf-email">Email <span aria-hidden="true">*</span></label><input class="hgl-cf__input" id="cf-email" name="email" type="email" required maxlength="200" autocomplete="email" inputmode="email"></div>
  </div>
  <div class="hgl-cf__field"><label for="cf-topic">Topic</label><select class="hgl-cf__input" id="cf-topic" name="topic">${TOPICS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></div>
  <div class="hgl-cf__field"><label for="cf-msg">Message <span aria-hidden="true">*</span></label><textarea class="hgl-cf__input" id="cf-msg" name="message" rows="6" required minlength="10" maxlength="5000" placeholder="If you're reporting an error, include the page and what looks wrong."></textarea></div>
  <p class="hgl-cf__privacy">We use your email only to reply. See our <a href="/p/privacy-policy.html">Privacy Policy</a>.</p>
  <button class="hgl-btn hgl-cf__btn" type="submit">Send message</button>
  <p class="hgl-cf__status" data-status role="status" aria-live="polite"></p>
</form>`
  : '<p class="hgl-note">The contact form is being set up. Please check back soon.</p>';

function rewriteHref(href) {
  if (!href) return href;
  let h = href.trim();
  if (h.startsWith(TOOLS_HOST)) {
    const p = h.slice(TOOLS_HOST.length) || '/';
    h = p === '/' ? '/tools/' : TOOL_MERGE[p.split('#')[0]] || p;
  }
  h = h.replace(/^https?:\/\/(www\.)?homegardenlot\.com(?=\/|$)/i, '') || '/';
  const [p, hash = ''] = h.split('#');
  const pathOnly = p.split('?')[0];
  if (MOVED[pathOnly]) return MOVED[pathOnly] + (hash ? `#${hash}` : '');
  const lbl = pathOnly.match(/^\/search\/label\/(.+)$/);
  if (lbl) return LABEL_HUB[decodeURIComponent(lbl[1]).toLowerCase()] || '/';
  if (/[?&]m=[01]/.test(p)) return pathOnly + (hash ? `#${hash}` : '');
  return h;
}

let LABEL_HUB = {};
function renderBody(item, byPath) {
  // Source comments (image briefs, editor notes) never reach the page.
  const src = item.html.replace(/<!--[\s\S]*?-->/g, '');
  const { document: d } = parseHTML(`<!doctype html><html><body><div id="b">${src}</div></body></html>`);
  const body = d.getElementById('b');
  const attr = (t, name) => (t.match(new RegExp('\\$' + name + '=\\{([^}]*)\\}')) || [])[1]?.trim() || '';
  const block = (el) => {
    const par = el.parentNode;
    return par && par !== body && /^(P|DIV|SPAN)$/.test(par.tagName) && par.textContent.trim() === el.textContent.trim() ? block(par) : el;
  };
  let tocSlot = null, wantToc = item.type === 'post';
  body.querySelectorAll('b, strong').forEach((el) => {
    const t = el.textContent.trim();
    if (!el.isConnected || (t[0] !== '{' && t[0] !== '$')) return;
    const target = block(el);
    if (/^\{getToc\}/.test(t)) { tocSlot = { el: target, title: attr(t, 'title') }; wantToc = true; return; }
    if (/^\{contactForm\}/.test(t)) { target.outerHTML = contactForm(); return; }
    if (/^\{(inAds|ads|showAds|nextPage|leftSidebar|rightSidebar|noSidebar|fullWidth)\}|^\$ads=/.test(t)) target.remove();
  });
  body.querySelectorAll('a').forEach((a) => {
    const t = a.textContent;
    if (t.includes('{getButton}')) {
      a.className = 'hgl-sc-btn';
      a.textContent = attr(t, 'text') || 'Open';
      if (attr(t, 'color')) a.setAttribute('style', `background:${attr(t, 'color')}`);
      if (/center/.test(a.parentNode?.getAttribute?.('style') || '')) a.classList.add('hgl-sc-btn--center');
    } else if (t.includes('{getCard}')) {
      const href = rewriteHref(a.getAttribute('href') || '#');
      const target = byPath[href.split(/[?#]/)[0]];
      const title = target?.title || attr(t, 'title') || href;
      const img = target?.image ? `<img class="hgl-sc-card__img" alt="" src="${esc(resize(target.image, 192, 144))}" width="96" height="72" loading="lazy" decoding="async">` : '';
      block(a).outerHTML = `<a class="hgl-sc-card" href="${esc(href)}">${img}<span><span class="hgl-sc-card__kicker">Related guide</span><span class="hgl-sc-card__title">${esc(title)}</span></span></a>`;
    }
  });
  const alerts = { alertSuccess: 'success', alertInfo: 'info', alertWarning: 'warning', alertError: 'error', codeBox: 'code' };
  body.querySelectorAll('blockquote').forEach((q) => {
    for (const [k, v] of Object.entries(alerts)) {
      if (!q.textContent.includes(`{${k}}`)) continue;
      const inner = q.innerHTML.replace(`{${k}}`, '');
      q.outerHTML = v === 'code' ? `<pre class="hgl-code">${inner}</pre>` : `<div class="hgl-alert hgl-alert--${v}">${inner}</div>`;
      break;
    }
  });
  body.querySelectorAll('p, b, strong, a, span').forEach((el) => {
    if (el.isConnected && /^\s*\{get(?!Toc)[A-Za-z]+\}/.test(el.textContent) && el.textContent.length < 400) block(el).remove();
  });
  // 2022-era posts are bare text lines split by <br>; wrap each run in a <p> so spacing matches the newer posts.
  if ([...body.childNodes].filter((n) => n.nodeName === 'BR').length >= 4) {
    const BLOCK = /^(H[1-6]|P|DIV|UL|OL|TABLE|FIGURE|BLOCKQUOTE|IFRAME|PRE|DETAILS|SECTION|ASIDE|HR|SCRIPT|STYLE|NAV|FORM)$/;
    let para = null;
    for (const n of [...body.childNodes]) {
      const blank = n.nodeType === 3 && !n.textContent.trim();
      if (n.nodeName === 'BR') { para = null; n.remove(); continue; }
      const imgOnly = n.nodeName === 'IMG' || (n.nodeName === 'A' && n.children.length === 1 && n.firstElementChild.nodeName === 'IMG' && !n.textContent.trim());
      if (BLOCK.test(n.nodeName) || imgOnly) { para = null; continue; }
      if (blank && !para) continue;
      if (!para) { para = d.createElement('p'); n.before(para); }
      para.appendChild(n);
    }
  }
  body.querySelectorAll('.separator').forEach((sep) => {
    for (const dir of ['previousSibling', 'nextSibling']) {
      let n = sep[dir];
      while (n && (n.nodeName === 'BR' || (n.nodeType === 3 && !n.textContent.trim()))) {
        const next = n[dir];
        if (n.nodeName === 'BR') n.remove();
        n = next;
      }
    }
  });
  // Links: same-site absolute → relative, moved pages → new home, external → new tab, no referrer trust.
  body.querySelectorAll('a[href]').forEach((a) => {
    const h = rewriteHref(a.getAttribute('href'));
    if (DEAD.has(h.split(/[?#]/)[0])) { a.replaceWith(...a.childNodes); return; }
    a.setAttribute('href', h);
    if (/^https?:\/\//.test(h)) {
      a.setAttribute('target', '_blank');
      if (!/noopener/.test(a.getAttribute('rel') || '')) a.setAttribute('rel', `${a.getAttribute('rel') || ''} noopener`.trim());
    }
  });
  // Images: first one is the LCP candidate; the rest load lazily.
  body.querySelectorAll('img').forEach((img, i) => {
    const src = img.getAttribute('src') || '';
    // Your own images (site/images): add width/height so the page never jumps while they load.
    if (src.startsWith('/images/')) {
      const file = path.join('site', decodeURIComponent(src.split(/[?#]/)[0]));
      if (!existsSync(file)) throw new Error(`${item.url}: image ${src} not found (upload it to ${file})`);
      if (!img.getAttribute('alt')) throw new Error(`${item.url}: image ${src} needs alt text (alt="what the picture shows")`);
      if (!img.getAttribute('width')) {
        const dim = imageSize(readFileSync(file));
        img.setAttribute('width', dim.width);
        img.setAttribute('height', dim.height);
      }
    }
    img.setAttribute('decoding', 'async');
    if (i === 0) { img.setAttribute('fetchpriority', 'high'); img.removeAttribute('loading'); } else img.setAttribute('loading', 'lazy');
  });
  body.querySelectorAll('iframe').forEach((f) => f.setAttribute('loading', 'lazy'));
  // Table of contents, built here so it never shifts the layout.
  const heads = [...body.querySelectorAll('h2, h3')];
  const used = {};
  for (const h of heads) {
    if (!h.id) {
      const base = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
      let id = base, n = 2;
      while (used[id]) id = `${base}-${n++}`;
      h.id = id;
    }
    used[h.id] = 1;
  }
  let toc = '';
  if (wantToc && heads.length >= 3) {
    let list = '', open = false;
    heads.forEach((h, i) => {
      const li = `<li><a href="#${h.id}">${esc(h.textContent.trim())}</a>`;
      if (h.tagName === 'H3' && i > 0) { list += open ? `</li>${li}` : `<ol class="hgl-toc__sub">${li}`; open = true; }
      else { list += `${open ? '</li></ol>' : ''}${i ? '</li>' : ''}${li}`; open = false; }
    });
    list += `${open ? '</li></ol>' : ''}</li>`;
    const title = tocSlot?.title || (item.type === 'post' ? 'In this guide' : 'On this page');
    toc = `<details class="hgl-toc" id="hgl-toc" open><summary><span class="hgl-toc__title">${esc(title)}</span></summary><ol class="hgl-toc__list">${list}</ol></details>`;
  }
  if (tocSlot?.el?.isConnected) tocSlot.el.outerHTML = toc ? '<!--TOC-->' : '';
  let html = body.innerHTML;
  if (html.includes('<!--TOC-->')) { html = html.replace('<!--TOC-->', toc); toc = ''; }
  // No {getToc} marker: the TOC goes just before the first H2, so the intro (the direct answer) and the featured image lead.
  else if (toc && html.includes('<h2')) { html = html.replace('<h2', `${toc}<h2`); toc = ''; }
  const faqs = [...body.querySelectorAll('.hgl-faq details')].map((dt) => {
    const q = dt.querySelector('summary')?.textContent.trim();
    const a = [...dt.children].filter((c) => c.tagName !== 'SUMMARY').map((c) => c.textContent.trim()).join(' ');
    return q && a ? { '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } } : null;
  }).filter(Boolean);
  const text = body.textContent.replace(/\s+/g, ' ').trim();
  const firstP = [...body.querySelectorAll('p')].map((p) => p.textContent.replace(/\s+/g, ' ').trim()).find((t) => t.length > 60 && !t.startsWith('{')) || text;
  return { html, toc, words: text.split(' ').length, firstP, faqs };
}

function summary(text, max = 155) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function card(p, i, lead) {
  return `<article class="hgl-card${lead ? ' hgl-card--lead' : ''}">
  <a class="hgl-card__media" href="${p.url}" tabindex="-1" aria-hidden="true">${p.image ? `<img class="hgl-card__img" alt="${esc(p.title)}" src="${esc(resize(p.image, 640, 360))}" width="640" height="360" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : ''}</a>
  <div class="hgl-card__body">
    <a class="hgl-card__label" href="${HUB[p.hub].url}">${esc(HUB[p.hub].name)}</a>
    <h2 class="hgl-card__title"><a href="${p.url}">${esc(p.title)}</a></h2>
    <p class="hgl-card__excerpt">${esc(p.description)}</p>
    <div class="hgl-card__meta"><time datetime="${p.date}">${fmtDate(p.date)}</time></div>
  </div>
</article>`;
}

function shareBlock(p, top) {
  const data = `data-title="${esc(p.title)}" data-url="${SITE}${p.url}" data-image="${esc(abs(p.image || ''))}"`;
  return top
    ? `<div class="hgl-share hgl-share--top" ${data}>${SHARE_ICONS}</div>`
    : `<div class="hgl-share" ${data}><span class="hgl-share__title">Save or share:</span><button class="hgl-share__btn hgl-share__btn--pin" data-net="pinterest" type="button">Pin it</button><button class="hgl-share__btn" data-net="facebook" type="button">Facebook</button><button class="hgl-share__btn" data-net="x" type="button">X</button><button class="hgl-share__btn" data-net="whatsapp" type="button">WhatsApp</button><button class="hgl-share__btn" data-net="copy" type="button">Copy link</button></div>`;
}

function postPage(p) {
  const hub = HUB[p.hub];
  const related = POSTS.filter((x) => x.hub === p.hub && x !== p).slice(0, 6);
  const updated = new Date(p.updated) - new Date(p.date) > 864e5;
  const minutes = Math.max(1, Math.round(p.words / 230));
  const body = `<article class="hgl-post">
  <nav aria-label="Breadcrumb" class="hgl-crumbs"><ol><li><a href="/">Home</a></li><li><a href="${hub.url}">${esc(hub.name)}</a></li><li aria-current="page">${esc(p.title)}</li></ol></nav>
  <h1 class="hgl-post__title">${esc(p.title)}</h1>
  <div class="hgl-post__meta">
    <a class="hgl-post__author" href="/p/about.html" rel="author"><span>By ${esc(p.author)}</span></a>
    <span>Published <time datetime="${p.date}">${fmtDate(p.date)}</time></span>
    ${updated ? `<span class="hgl-post__updated">Updated <time datetime="${p.updated}">${fmtDate(p.updated)}</time></span>` : ''}
    ${p.words > 120 ? `<span>${minutes} min read</span>` : ''}
    ${shareBlock(p, true)}
  </div>
  ${p.toc}
  <div class="hgl-post__body" id="hgl-post-body">
${p.body}
  </div>
  ${shareBlock(p, false)}
  <ul aria-label="Topics" class="hgl-tags"><li><a class="hgl-chip" href="${hub.url}" rel="tag">${esc(hub.name)}</a></li></ul>
  <aside aria-label="About the author" class="hgl-author">
    <img class="hgl-author__img" src="${AUTHOR_PHOTO}" alt="${esc(p.author)}" width="72" height="72" loading="lazy" decoding="async">
    <div>
      <p class="hgl-author__kicker">Written by</p>
      <p class="hgl-author__name">${esc(p.author)}</p>
      <p class="hgl-author__bio">Home gardener and DIY writer. Every guide is researched against university extension and manufacturer sources before publishing.</p>
      <p class="hgl-author__links"><a href="/p/about.html">Full bio &amp; credentials</a><a href="/p/editorial-policy.html">How we research &amp; review</a><a href="/p/contact.html">Suggest a correction</a></p>
    </div>
  </aside>
  ${related.length ? `<section class="hgl-related" style="min-height:0"><h2 class="hgl-related__title">More ${esc(hub.name)} guides</h2><ul class="hgl-related__grid">${related.map((r) => `<li class="hgl-related__item"><a href="${r.url}">${r.image ? `<img class="hgl-related__thumb" alt="" src="${esc(resize(r.image, 400, 225))}" width="400" height="225" loading="lazy" decoding="async">` : ''}${esc(r.title)}</a></li>`).join('')}</ul></section>` : ''}
</article>`;
  const graph = [
    { '@type': 'BlogPosting', '@id': `${SITE}${p.url}#article`, mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}${p.url}` }, headline: p.title, description: p.description,
      datePublished: p.date, dateModified: p.updated, inLanguage: 'en-US', wordCount: p.words,
      ...(p.image ? { image: { '@type': 'ImageObject', url: abs(resize(p.image, 1200, 675)), width: 1200, height: 675 } } : {}),
      author: { '@type': 'Person', name: p.author, url: `${SITE}/p/about.html` }, publisher: { '@id': ORG_ID }, isPartOf: { '@id': SITE_ID }, articleSection: hub.name },
    ...(p.faqs.length && !/FAQPage/.test(p.body) ? [{ '@type': 'FAQPage', '@id': `${SITE}${p.url}#faq`, mainEntity: p.faqs }] : []),
    { '@type': 'BreadcrumbList', itemListElement: [['Home', `${SITE}/`], [hub.name, `${SITE}${hub.url}`], [p.title]].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, ...(u ? { item: u } : {}) })) },
  ];
  return shell({ url: p.url, title: p.title, description: p.description, body, bodyClass: 'hgl-body hgl-body--item', image: p.image, type: 'article', graph,
    extraHead: `<meta property="article:published_time" content="${p.date}">\n<meta property="article:modified_time" content="${p.updated}">` });
}

// The Blogger HTML sitemap read the Blogger feed in the browser; here it is built from the content.
function htmlSitemap() {
  const group = (title, list) => `<h2>${esc(title)}</h2><ul>${list.map((x) => `<li><a href="${x.url}">${esc(x.title)}</a></li>`).join('')}</ul>`;
  return `<p>Every guide and free tool on ${BRAND}, by topic. Newest first.</p>
${liveHubs().map(([s, n]) => group(n, POSTS.filter((p) => p.hub === s))).join('\n')}
${group('Free tools', [{ url: '/tools/', title: 'All free tools and calculators' }, ...TOOL_LINKS.map(([url, title]) => ({ url, title }))])}
${group('About this site', [['/p/about.html', 'About & author'], ['/p/editorial-policy.html', 'Editorial policy'], ['/p/contact.html', 'Contact'], ['/p/privacy-policy.html', 'Privacy policy'], ['/p/terms-of-service.html', 'Terms of use'], ['/p/disclaimer.html', 'Disclaimer & affiliate disclosure']].map(([url, title]) => ({ url, title })))}`;
}

function staticPage(p) {
  if (p.url === '/p/sitemap.html') Object.assign(p, { body: htmlSitemap(), toc: '' });
  const body = `<article class="hgl-post">
  ${/<h1[\s>]/i.test(p.body) ? '' : `<h1 class="hgl-post__title">${esc(p.title)}</h1>`}
  ${p.toc}
  <div class="hgl-post__body" id="hgl-post-body">
${p.body}
  </div>
</article>`;
  const ownSchema = /application\/ld\+json/.test(p.body);
  const graph = ownSchema ? [] : [{ '@type': 'WebPage', '@id': `${SITE}${p.url}#webpage`, url: `${SITE}${p.url}`, name: p.title, description: p.description, inLanguage: 'en-US', isPartOf: { '@id': SITE_ID }, publisher: { '@id': ORG_ID }, dateModified: p.updated }];
  const title = p.title.length < 30 ? `${p.title} | ${BRAND}` : p.title;
  return shell({ url: p.url, title, description: p.description, body, bodyClass: 'hgl-body hgl-body--page', image: p.image, graph, sidebar: false });
}

function listPage({ url, title, h1, kicker, desc, posts, crumbs, noindex = false, isHome = false, hero = '', schemaType = 'CollectionPage' }) {
  const head = isHome ? '<h2 class="hgl-sr">Latest guides</h2>' : `<header class="hgl-archive">
  ${crumbs ? `<nav aria-label="Breadcrumb" class="hgl-crumbs"><ol><li><a href="/">Home</a></li><li aria-current="page">${esc(h1)}</li></ol></nav>` : ''}
  <p class="hgl-archive__kicker">${esc(kicker)}</p>
  <h1 class="hgl-archive__title">${esc(h1)}</h1>
  <p class="hgl-archive__desc">${esc(desc)}</p>
</header>`;
  const body = `${head}
<div class="hgl-grid">
${posts.map((p, i) => card(p, i, isHome && i === 0)).join('\n')}
</div>`;
  const graph = [{ '@type': schemaType, '@id': `${SITE}${url}#webpage`, url: `${SITE}${url}`, name: title, description: desc, isPartOf: { '@id': SITE_ID },
    mainEntity: { '@type': 'ItemList', itemListElement: posts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}${p.url}` })) } }];
  if (crumbs) graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: h1, item: `${SITE}${url}` }] });
  return shell({ url, title, description: desc, body, graph, noindex, isHome, hero, image: posts[0]?.image });
}

// ---------- Tools merge ----------
async function mergeTools(header, footer) {
  if (!TOOLS_DIR) { console.log('TOOLS_DIR not set: building the blog only.'); return []; }
  const files = await walk(TOOLS_DIR);
  const skipDirs = Object.keys(TOOL_MERGE).map((p) => p.slice(1, -1));
  const htmlPaths = [];
  for (const f of files) {
    const rel = path.relative(TOOLS_DIR, f).split(path.sep).join('/');
    if (skipDirs.some((d) => rel.startsWith(`${d}/`)) || ['404.html', 'robots.txt', 'sitemap.xml', 'CNAME', 'page-hashes.json'].includes(rel)) continue;
    let dest = rel === 'index.html' ? 'tools/index.html' : rel;
    if (existsSync(path.join(OUT, dest))) throw new Error(`URL clash: tools page /${dest} has the same address as a blog page. Rename the article.`);
    if (rel === 'llms.txt') dest = '.tools-llms.txt';
    if (!rel.endsWith('.html')) {
      await mkdir(path.dirname(path.join(OUT, dest)), { recursive: true });
      if (/\.(txt|webmanifest|xml|json|js)$/.test(rel) && !/^data\//.test(rel)) {
        const t = (await readFile(f, 'utf8')).split(TOOLS_HOST).join(SITE);
        await writeFile(path.join(OUT, dest), t);
      } else await cp(f, path.join(OUT, dest));
      continue;
    }
    let h = await readFile(f, 'utf8');
    // Embeds (iframe widgets) have no site chrome; they only need the host rewrite.
    const chrome = !rel.startsWith('embed/') || rel === 'embed/index.html';
    const need = (re, what) => { if (!re.test(h)) throw new Error(`Tools page ${rel}: ${what} not found; the tools markup changed, update mergeTools().`); };
    if (chrome) {
      need(/<header class="hgt-header">[\s\S]*?<\/header>/, 'header');
      need(/<footer class="hgt-footer">[\s\S]*?<\/footer>/, 'footer');
    }
    if (chrome) h = h.replace(/<header class="hgt-header">[\s\S]*?<\/header>/, header).replace(/<footer class="hgt-footer">[\s\S]*?<\/footer>/, footer)
      .replace(/<a class="hgt-skip" href="#main">[^<]*<\/a>\n?/, '');
    h = h.split(TOOLS_HOST).join(SITE)
      .replace('<li><a href="/">Tools</a></li>', '<li><a href="/">Home</a></li><li><a href="/tools/">Tools</a></li>')
      .replace(/href="\/#/g, 'href="/tools/#')
      .replace(/href="(\/about\/|\/privacy\/|\/terms\/|\/contact\/)([#"])/g, (m, p, end) => `href="${TOOL_MERGE[p]}${end}`)
      .replace(/<meta property="og:site_name" content="[^"]*">/, `<meta property="og:site_name" content="${BRAND}">`)
      .replace(/<link rel="icon"[^>]*>\n?/g, '').replace(/<link rel="apple-touch-icon"[^>]*>\n?/g, '')
      .replace(/<link rel="manifest"[^>]*>/, `${ICON_LINKS}\n${SPECULATION}`);
    // Breadcrumb JSON-LD: Tools now sits under Home.
    h = h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, json) => {
      const data = JSON.parse(json);
      const fix = (n) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) return n.forEach(fix);
        if (n['@type'] === 'BreadcrumbList' && n.itemListElement?.[0]?.item === `${SITE}/`) {
          n.itemListElement[0].item = `${SITE}/tools/`;
          n.itemListElement.unshift({ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` });
          n.itemListElement.forEach((it, i) => { it.position = i + 1; });
        }
        if (n['@type'] === 'WebSite') { n.name = BRAND; n.url = `${SITE}/`; }
        if (n['@type'] === 'CollectionPage' && n.url === `${SITE}/`) { n.url = `${SITE}/tools/`; n['@id'] = `${SITE}/tools/#webpage`; }
        Object.values(n).forEach(fix);
      };
      fix(data);
      return jsonLd(data);
    });
    if (dest === 'tools/index.html') h = h.replace(`<link rel="canonical" href="${SITE}/">`, `<link rel="canonical" href="${SITE}/tools/">`).replace(`<meta property="og:url" content="${SITE}/">`, `<meta property="og:url" content="${SITE}/tools/">`);
    const indexable = !/<meta name="robots" content="noindex/.test(h);
    if (PREVIEW && indexable) h = h.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow" data-preview="1">');
    if (chrome) {
      h = h.replace('</head>', `<link rel="preconnect" href="https://blogger.googleusercontent.com">\n<style>${SHELL_CSS}\nbody{margin:0}</style>\n</head>`)
        .replace('</body>', '<script src="/assets/hgl.js" defer></script>\n</body>');
    }
    await write(dest, h);
    if (indexable) htmlPaths.push(`/${dest.replace(/index\.html$/, '')}`);
  }
  return htmlPaths;
}

// ---------- Main ----------
async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const items = [];
  for (const f of (await walk('site/content')).filter((x) => x.endsWith('.html'))) {
    const it = parseFile(await readFile(f, 'utf8'), f);
    const rel = path.relative('site/content', f).split(path.sep).join('/');
    // posts/YYYY/MM/slug.html: Blogger-era URLs, kept as they are. articles/slug.html: new posts at /slug/.
    it.type = rel.startsWith('pages/') ? 'page' : 'post';
    it.url = rel.startsWith('articles/') ? `/${path.basename(rel, '.html')}/` : it.type === 'post' ? `/${rel.slice(6)}` : `/p/${rel.slice(6)}`;
    it.author ||= BRAND;
    // draft: true keeps a post off the live site; the preview shows it so you can check it first.
    if (/^(true|yes|1)$/i.test(it.draft || '') && !PREVIEW) continue;
    if (it.type === 'post' && !HUB[it.hub]) throw new Error(`${f}: unknown hub "${it.hub}"`);
    items.push(it);
  }
  const byPath = Object.fromEntries(items.map((i) => [i.url, i]));
  for (const it of items) for (const l of (it.labels || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) {
    if (it.hub) (LABEL_HUB[l] ||= {})[it.hub] = ((LABEL_HUB[l] || {})[it.hub] || 0) + 1;
  }
  // Each Blogger label goes to the hub most of its posts belong to.
  LABEL_HUB = Object.fromEntries(Object.entries(LABEL_HUB).map(([l, c]) => [l, HUB[Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]].url]));

  for (const it of items) {
    // New posts: the featured image (front matter image + imageAlt) opens the article unless the body already shows it.
    if (it.type === 'post' && it.image?.startsWith('/images/') && !it.html.includes(it.image)) {
      if (!it.imageAlt) throw new Error(`${it.url}: add imageAlt: to the front matter (describes the featured image)`);
      it.html = `<img src="${esc(it.image)}" alt="${esc(it.imageAlt)}">\n${it.html}`;
    }
    const r = renderBody(it, byPath);
    Object.assign(it, { body: r.html, toc: r.toc, words: r.words, faqs: r.faqs });
    it.description ||= summary(r.firstP);
  }
  POSTS = items.filter((i) => i.type === 'post').sort((a, b) => new Date(b.date) - new Date(a.date));
  const pages = items.filter((i) => i.type === 'page');

  for (const p of POSTS) await write(p.url, postPage(p));
  for (const p of pages) await write(p.url, staticPage(p));

  const hero = `<section class="hgl-hero"><div class="hgl-hero__inner">
  <h2 class="hgl-hero__title">Grow more. Fix smarter. Spend less.</h2>
  <p class="hgl-hero__lead">Step-by-step guides and free calculators for vegetable gardens, lawns, landscaping and DIY home improvement — written for real homeowners.</p>
  <ul class="hgl-hero__chips">${liveHubs().map(([s, n]) => `<li><a class="hgl-chip" href="/category/${s}/">${esc(n)}</a></li>`).join('')}<li><a class="hgl-chip" href="/tools/">Free Calculators</a></li></ul>
</div></section>`;
  await write('index.html', listPage({ url: '/', title: `${BRAND}: Garden & Home Improvement Guides`, h1: BRAND, desc: 'Practical guides and free calculators for growing food, garden design, pest control and DIY home improvement, researched against university extension sources.', posts: POSTS.slice(0, 13), isHome: true, hero }));
  for (const [s, n, d] of liveHubs()) {
    const list = POSTS.filter((p) => p.hub === s);
    await write(`category/${s}/index.html`, listPage({ url: `/category/${s}/`, title: `${n} Guides | ${BRAND}`, h1: n, kicker: 'Topic', desc: d, posts: list, crumbs: true }));
  }
  // Date archives keep Blogger's /YYYY/ and /YYYY/MM/ URLs alive; noindex, like Blogger's.
  const periods = {};
  for (const p of POSTS.filter((x) => /^\/\d{4}\/\d{2}\//.test(x.url))) {
    const [, y, m] = p.url.split('/');
    (periods[`/${y}/`] ||= []).push(p);
    (periods[`/${y}/${m}/`] ||= []).push(p);
  }
  for (const [u, list] of Object.entries(periods)) {
    const [y, m] = u.split('/').filter(Boolean);
    const label = m ? new Date(Date.UTC(+y, +m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : y;
    await write(`${u.slice(1)}index.html`, listPage({ url: u, title: `Guides from ${label} | ${BRAND}`, h1: label, kicker: 'Archive', desc: `Guides published in ${label}.`, posts: list, noindex: true }));
  }
  // Old Blogger label pages: meta-refresh fallback (Cloudflare serves the real 301 once live).
  const labels = new Set(items.flatMap((i) => (i.labels || '').split(',').map((s) => s.trim()).filter(Boolean)));
  for (const l of labels) {
    const to = LABEL_HUB[l.toLowerCase()] || '/';
    await write(`search/label/${l}/index.html`, `<!doctype html><meta charset="utf-8"><title>${esc(l)}</title><meta name="robots" content="noindex"><link rel="canonical" href="${SITE}${to}"><meta http-equiv="refresh" content="0;url=${to}"><a href="${to}">${esc(l)}</a>\n`);
  }
  // tools.* 301s keep the path, so the tool site's old legal pages land here: forward them to the blog versions.
  for (const [from, to] of Object.entries({ ...MOVED, ...TOOL_MERGE })) {
    await write(from.slice(1), `<!doctype html><meta charset="utf-8"><title>Moved</title><meta name="robots" content="noindex"><link rel="canonical" href="${SITE}${to}"><meta http-equiv="refresh" content="0;url=${to}"><a href="${to}">This page has moved</a>\n`);
  }

  // Search: a small JSON index searched in the browser.
  await write('search-index.json', JSON.stringify(POSTS.map((p) => ({ t: p.title, u: p.url, d: p.description, h: HUB[p.hub].name })).concat(
    pages.filter((p) => !/\/p\/(sitemap|contact|terms|privacy|disclaimer)/.test(p.url)).map((p) => ({ t: p.title, u: p.url, d: p.description, h: 'Tools & pages' })))));
  await write('search/index.html', shell({ url: '/search/', title: `Search | ${BRAND}`, description: `Search every ${BRAND} guide and tool.`, noindex: true,
    body: `<header class="hgl-archive"><p class="hgl-archive__kicker">Search</p><h1 class="hgl-archive__title" id="hgl-search-title">Search our guides</h1></header>
<form action="/search/" class="hgl-search" method="get" role="search" style="max-width:520px;margin-bottom:24px"><label class="hgl-sr" for="hgl-q3">Search</label><input class="hgl-search__input" id="hgl-q3" name="q" type="search" placeholder="e.g. raised bed soil" style="width:100%"><button aria-label="Search" class="hgl-search__btn" type="submit">Go</button></form>
<div class="hgl-grid" id="hgl-results" aria-live="polite"></div>
<script src="/assets/search.js" defer></script>` }));

  await write('404.html', shell({ url: '/404.html', title: `Page not found | ${BRAND}`, description: 'The page you were looking for was not found.', noindex: true,
    body: `<div class="hgl-404"><h1>Page not found</h1><p>The page may have moved. Try searching our guides:</p>
<form action="/search/" class="hgl-search" method="get" role="search"><label class="hgl-sr" for="hgl-q4">Search</label><input class="hgl-search__input" id="hgl-q4" name="q" placeholder="e.g. raised bed soil" type="search"><button aria-label="Search" class="hgl-search__btn" type="submit">Go</button></form>
<p><a href="/">← Back to homepage</a> · <a href="/tools/">Free tools</a></p></div>` }));

  await mkdir(path.join(OUT, 'assets'), { recursive: true });
  for (const f of await readdir('site/assets')) await cp(path.join('site/assets', f), path.join(OUT, 'assets', f));
  if (existsSync('site/images')) await cp('site/images', path.join(OUT, 'images'), { recursive: true });

  const toolPaths = await mergeTools(headerHtml(false).replace('id="hgl-q"', 'id="hgl-qt"').replace('for="hgl-q"', 'for="hgl-qt"'), footerHtml());

  // Brand icons and the web app manifest (after the tools merge, so these win).
  for (const f of await readdir('site/root')) await cp(path.join('site/root', f), path.join(OUT, f));
  await write('manifest.webmanifest', JSON.stringify({
    name: BRAND, short_name: 'Garden Lot', description: 'Garden and home improvement guides with free calculators: frost dates, planting calendar, soil, mulch and more.',
    start_url: '/', scope: '/', display: 'standalone', background_color: '#f4f4f5', theme_color: '#247b49',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
    shortcuts: [{ name: 'Frost dates by ZIP', url: '/frost-dates/' }, { name: 'Planting calendar', url: '/p/planting-calendar.html' }, { name: 'All tools', url: '/tools/' }],
  }, null, 1));

  // Feed (Atom), sitemap, robots, llms.txt.
  const feedPosts = POSTS.slice(0, 25);
  await write('feed.xml', `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>${BRAND}</title>
<link href="${SITE}/"/>
<link rel="self" href="${SITE}/feed.xml"/>
<id>${SITE}/</id>
<updated>${new Date(Math.max(...feedPosts.map((p) => +new Date(p.updated)))).toISOString()}</updated>
<author><name>${BRAND}</name></author>
${feedPosts.map((p) => `<entry><title>${esc(p.title)}</title><link href="${SITE}${p.url}"/><id>${SITE}${p.url}</id><published>${new Date(p.date).toISOString()}</published><updated>${new Date(p.updated).toISOString()}</updated><category term="${esc(HUB[p.hub].name)}"/><summary>${esc(p.description)}</summary>${p.image ? `<link rel="enclosure" type="image/jpeg" href="${esc(abs(resize(p.image, 1200, 675)))}"/>` : ''}</entry>`).join('\n')}
</feed>
`);
  const urls = [
    ['/', POSTS[0].updated], ...liveHubs().map(([s]) => [`/category/${s}/`, POSTS.find((p) => p.hub === s)?.updated]),
    ...POSTS.map((p) => [p.url, p.updated]), ...pages.map((p) => [p.url, p.updated]),
    ...toolPaths.map((u) => [u, null]),
  ];
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d]) => `<url><loc>${SITE}${u}</loc>${d ? `<lastmod>${isoDay(d)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);
  await write('robots.txt', PREVIEW ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  const toolsLlms = existsSync(path.join(OUT, '.tools-llms.txt')) ? await readFile(path.join(OUT, '.tools-llms.txt'), 'utf8') : '';
  await rm(path.join(OUT, '.tools-llms.txt'), { force: true });
  await write('llms.txt', `# ${BRAND}

> Practical guides and free calculators for home gardeners and DIY homeowners: growing vegetables and fruit, garden design, soil and compost, pest control, houseplants and home improvement. Tools use public data from NOAA, the USDA and university extension services.

## Topic hubs
${liveHubs().map(([s, n, d]) => `- [${n}](${SITE}/category/${s}/): ${d}`).join('\n')}

## Guides
${POSTS.map((p) => `- [${p.title}](${SITE}${p.url}): ${p.description}`).join('\n')}

## Pages
${pages.map((p) => `- [${p.title}](${SITE}${p.url})`).join('\n')}
${toolsLlms ? `\n## Free tools and data\n\n${toolsLlms.replace(/^# .*\n/, '').replace(/^##/gm, '###').trim()}\n` : ''}`);

  // Content hashes of indexable pages, so the deploy can tell IndexNow only what changed.
  const hashes = {};
  for (const [u] of urls) {
    const f = path.join(OUT, u.endsWith('/') ? `${u}index.html` : u);
    if (existsSync(f)) hashes[`${SITE}${u}`] = createHash('sha1').update(await readFile(f)).digest('hex').slice(0, 16);
  }
  await write('page-hashes.json', JSON.stringify(hashes));

  console.log(`Built ${POSTS.length} posts, ${pages.length} pages, ${HUBS.length} hubs, ${Object.keys(periods).length} archives, ${labels.size} label stubs, ${toolPaths.length} tool pages${PREVIEW ? ' (PREVIEW: noindex)' : ''}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
