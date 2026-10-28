#!/usr/bin/env node
// Creates or updates Blogger DRAFTS from content/posts/*.html.
// Never publishes and never touches a post that is already live or scheduled.
//
// Env: BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, BLOGGER_REFRESH_TOKEN, BLOGGER_BLOG_ID
//      DRY_RUN=1 to parse and print without calling the API.
// Usage: node scripts/blogger-drafts.mjs content/posts/a.html content/posts/b.html
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { api, accessToken, checkSecrets, sleep } from './lib/blogger-client.mjs';

const ID_FILE = 'content/.blogger-ids.json';
const MAX_PER_RUN = 10; // one daily batch; drafts aren't public, but keep runs small and spaced
const FORCE = process.env.FORCE === '1';
const PAUSE_MS = 8000;
const DRY = process.env.DRY_RUN === '1';


function listPosts() {
  try {
    const names = readdirSync('content/posts').filter((n) => n.endsWith('.html') && !n.startsWith('_'));
    return names.length ? names.join(', ') : 'none yet';
  } catch {
    return 'none yet';
  }
}

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


async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log('No post files to process.');
    return;
  }
  // Every file named explicitly must be valid, so a typo fails the run instead of passing silently.
  const problems = args.map((f) => {
    if (!/^content\/posts\/[^/]+\.html$/.test(f)) return `${f}: must be a .html file directly inside content/posts/`;
    if (path.basename(f).startsWith('_')) return `${f}: files starting with "_" are templates and are never sent`;
    if (!existsSync(f)) return `${f}: file not found on main (check the name; posts in content/posts/: ${listPosts()})`;
    return null;
  }).filter(Boolean);
  if (problems.length) throw new Error(problems.join('\n'));
  const files = args;
  if (files.length > MAX_PER_RUN) {
    throw new Error(`${files.length} posts in one run (limit ${MAX_PER_RUN}). Push them in smaller batches so the blog isn't flagged for bulk posting.`);
  }

  const ids = existsSync(ID_FILE) ? JSON.parse(await readFile(ID_FILE, 'utf8')) : {};
  const posts = await Promise.all(files.map(async (f) => ({ file: f, ...parse(await readFile(f, 'utf8'), f) })));

  if (DRY) {
    for (const p of posts) console.log(`[dry-run] ${entry(ids[p.file]).id ? 'update' : 'create'} draft: "${p.title}" [${p.labels.join(', ')}] ${p.content.length} chars`);
    return;
  }

  const blogBase = checkSecrets();
  const blog = `${blogBase}/posts`;
  const token = await accessToken();

  const save = () => writeFile(ID_FILE, JSON.stringify(ids, null, 2) + '\n');

  for (const [i, p] of posts.entries()) {
    if (i) await sleep(PAUSE_MS);
    const body = { kind: 'blogger#post', title: p.title, content: p.content, labels: p.labels };
    const { id, updated } = entry(ids[p.file]);
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
        // Never overwrite work done in the Blogger editor (photos, experience, permalink).
        if (!FORCE && current.updated !== updated) {
          console.log(`::warning::Skip ${p.file}: the draft was edited in Blogger after the last sync, so updating it would erase those edits. Make the change in Blogger, or re-run manually with force to overwrite.`);
          continue;
        }
        const patched = await api(token, 'PATCH', `${blog}/${id}`, body);
        ids[p.file] = { id, updated: patched.updated };
        await save();
        console.log(`Updated draft: "${p.title}"`);
        continue;
      }
    }
    const created = await api(token, 'POST', `${blog}?isDraft=true`, body);
    ids[p.file] = { id: created.id, updated: created.updated };
    await save(); // saved per post so a later failure can't cause duplicate drafts on the next run
    console.log(`Created draft: "${p.title}" (id ${created.id})`);
  }
}

// Older entries were a bare post ID with no sync time; those are treated as "possibly edited".
function entry(v) {
  return typeof v === 'string' ? { id: v, updated: null } : (v || {});
}

main().catch((e) => {
  console.error(`::error::${e.message}`);
  process.exit(1);
});
