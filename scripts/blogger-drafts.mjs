#!/usr/bin/env node
// Creates or updates Blogger DRAFTS from content/posts/*.html.
// Never publishes and never touches a post that is already live or scheduled.
//
// Env: BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, BLOGGER_REFRESH_TOKEN, BLOGGER_BLOG_ID
//      DRY_RUN=1 to parse and print without calling the API.
// Usage: node scripts/blogger-drafts.mjs content/posts/a.html content/posts/b.html
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const API = 'https://www.googleapis.com/blogger/v3';
const ID_FILE = 'content/.blogger-ids.json';
const MAX_PER_RUN = 5; // a burst of new posts is what trips Blogger's spam classifier
const PAUSE_MS = 8000;
const DRY = process.env.DRY_RUN === '1';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parse(raw, file) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter (--- title: … ---)`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1].toLowerCase()] = kv[2].trim();
  }
  if (!meta.title) throw new Error(`${file}: front matter needs a title`);
  const labels = (meta.labels || '').split(',').map((s) => s.trim()).filter(Boolean);
  const content = m[2].trim();
  if (content.length < 300) throw new Error(`${file}: body is under 300 characters — refusing to create a thin draft`);
  return { title: meta.title, labels, content };
}

async function accessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.BLOGGER_CLIENT_ID,
      client_secret: process.env.BLOGGER_CLIENT_SECRET,
      refresh_token: process.env.BLOGGER_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const hint = data.error === 'invalid_grant'
      ? ' — the refresh token expired or was revoked. If the OAuth consent screen is still in "Testing", tokens die after 7 days: publish it to "In production" and generate a new token (docs/BLOGGER-AUTOPOST.md, step 3).'
      : '';
    throw new Error(`Token refresh failed: ${data.error || res.status}${hint}`);
  }
  return data.access_token;
}

async function api(token, method, url, body) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return res.json();
    const text = await res.text();
    // 429/5xx are transient; back off instead of hammering the API.
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(attempt * 15000);
      continue;
    }
    throw new Error(`${method} ${url.replace(/\?.*/, '')} → ${res.status}: ${text.slice(0, 300)}`);
  }
}

async function main() {
  const files = process.argv.slice(2)
    .filter((f) => /^content\/posts\/[^/]+\.html$/.test(f) && !path.basename(f).startsWith('_') && existsSync(f));
  if (!files.length) {
    console.log('No post files to process.');
    return;
  }
  if (files.length > MAX_PER_RUN) {
    throw new Error(`${files.length} posts in one run (limit ${MAX_PER_RUN}). Push them in smaller batches so the blog isn't flagged for bulk posting.`);
  }

  const ids = existsSync(ID_FILE) ? JSON.parse(await readFile(ID_FILE, 'utf8')) : {};
  const posts = await Promise.all(files.map(async (f) => ({ file: f, ...parse(await readFile(f, 'utf8'), f) })));

  if (DRY) {
    for (const p of posts) console.log(`[dry-run] ${ids[p.file] ? 'update' : 'create'} draft: "${p.title}" [${p.labels.join(', ')}] ${p.content.length} chars`);
    return;
  }

  for (const k of ['BLOGGER_CLIENT_ID', 'BLOGGER_CLIENT_SECRET', 'BLOGGER_REFRESH_TOKEN', 'BLOGGER_BLOG_ID']) {
    if (!process.env[k]) throw new Error(`Missing secret ${k}`);
  }
  const blog = `${API}/blogs/${encodeURIComponent(process.env.BLOGGER_BLOG_ID)}/posts`;
  const token = await accessToken();

  for (const [i, p] of posts.entries()) {
    if (i) await sleep(PAUSE_MS);
    const body = { kind: 'blogger#post', title: p.title, content: p.content, labels: p.labels };
    const id = ids[p.file];
    if (id) {
      let current;
      try {
        current = await api(token, 'GET', `${blog}/${id}?view=AUTHOR&fetchBody=false`);
      } catch (e) {
        if (!/→ 404/.test(e.message)) throw e;
        console.log(`Draft ${id} for ${p.file} was deleted in Blogger; creating a new one.`);
      }
      if (current && current.status !== 'DRAFT') {
        console.log(`Skip ${p.file}: post is ${current.status}. Edit live posts in Blogger, not here.`);
        continue;
      }
      if (current) {
        await api(token, 'PATCH', `${blog}/${id}`, body);
        console.log(`Updated draft: "${p.title}"`);
        continue;
      }
    }
    const created = await api(token, 'POST', `${blog}?isDraft=true`, body);
    ids[p.file] = created.id;
    console.log(`Created draft: "${p.title}" (id ${created.id})`);
  }

  await writeFile(ID_FILE, JSON.stringify(ids, null, 2) + '\n');
}

main().catch((e) => {
  console.error(`::error::${e.message}`);
  process.exit(1);
});
