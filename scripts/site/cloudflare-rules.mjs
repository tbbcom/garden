#!/usr/bin/env node
// Creates the migration's 301 redirects as Cloudflare Single Redirect rules (7 of the free plan's 10).
// Run once at switch-over (workflow "Deploy www" → "apply_redirects"). Idempotent: replaces only
// rules whose description starts with "hgl-migrate:", and keeps every other rule in the zone.
// Env: CF_API_TOKEN (Zone → Single Redirect → Edit, plus Zone → Zone → Read), CF_ZONE_ID, DRY_RUN=1
import { MOVED } from './redirect-map.mjs';

const WWW = 'https://www.homegardenlot.com';
const TOOLS = 'tools.homegardenlot.com';
const API = `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/rulesets/phases/http_request_dynamic_redirect/entrypoint`;
const TAG = 'hgl-migrate:';

const rule = (desc, expression, target, dynamic = false) => ({
  description: `${TAG} ${desc}`,
  expression,
  action: 'redirect',
  action_parameters: { from_value: { status_code: 301, preserve_query_string: true, target_url: dynamic ? { expression: target } : { value: target } } },
});

// Most specific first: Cloudflare runs the first matching redirect only.
const rules = [
  rule('tools home → /tools/', `(http.host eq "${TOOLS}" and http.request.uri.path eq "/")`, `${WWW}/tools/`),
  rule('homegardenlot.com → www (same path)', `(http.host eq "homegardenlot.com")`, `concat("${WWW}", http.request.uri.path)`, true),
  rule('tools.* → www (same path; old legal pages forward from there)', `(http.host eq "${TOOLS}")`, `concat("${WWW}", http.request.uri.path)`, true),
  rule('Blogger feeds → /feed.xml', `(http.host eq "www.homegardenlot.com" and (starts_with(http.request.uri.path, "/feeds/posts") or starts_with(http.request.uri.path, "/feeds/pages") or starts_with(http.request.uri.path, "/feeds/comments") or http.request.uri.path in {"/atom.xml" "/rss.xml"}))`, `${WWW}/feed.xml`),
  ...Object.entries(MOVED).slice(0, 3).map(([from, to]) => rule(`${from} → ${to}`, `(http.host eq "www.homegardenlot.com" and http.request.uri.path eq "${from}")`, `${WWW}${to}`)),
];

async function cf(method, body) {
  const res = await fetch(API, { method, headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok && !(method === 'GET' && res.status === 404)) throw new Error(`Cloudflare ${method} → ${res.status}: ${JSON.stringify(j.errors || j).slice(0, 400)}`);
  return res.status === 404 ? { result: { rules: [] } } : j;
}

const current = (await cf('GET')).result?.rules || [];
const others = current.filter((r) => !(r.description || '').startsWith(TAG));
const next = [...rules, ...others].map(({ description, expression, action, action_parameters }) => ({ description, expression, action, action_parameters }));
console.log(`${rules.length} migration rules + ${others.length} existing rule(s) kept = ${next.length}.`);
rules.forEach((r) => console.log(`  ${r.description}`));
if (next.length > 10) console.log('::warning::More than 10 rules: the free plan may refuse. Remove unused redirect rules in Cloudflare first.');
if (process.env.DRY_RUN === '1') process.exit(0);
await cf('PUT', { rules: next });
console.log('Redirect rules saved.');
