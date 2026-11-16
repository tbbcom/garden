#!/usr/bin/env node
// Reads the IMAGE BRIEF comment in every post and article, then:
//  1. adds an image slot for each INLINE image in the body: <!--img:FILE|ALT|CAPTION--> (the build shows it
//     as soon as site/images/<slug>/FILE exists, and hides it until then)
//  2. adds photo:/photoAlt: to the front matter for the FEATURED image (an uploaded photo replaces the illustration)
//  3. writes docs/IMAGE-BRIEFS.md: every image still to make or upload, with filename, alt, title, caption and prompts
// Idempotent: safe to run again after each batch. Usage: node scripts/site/image-briefs.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

async function walk(d) { const o = []; for (const e of await readdir(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? o.push(...(await walk(p))) : o.push(p); } return o; }
const field = (b, k) => (b.match(new RegExp(`^\\s*${k}:\\s*(.+)$`, 'mi')) || [])[1]?.trim() || '';

function parse(brief) {
  return brief.split(/\n\s*(?=\d+\.\s+[A-Z])/).map((b) => b.trim()).filter((b) => /^\d+\./.test(b)).map((b) => {
    const label = b.split('\n')[0];
    const type = /FEATURED/i.test(label) ? 'featured' : /PINTEREST/i.test(label) ? 'pin' : /INLINE/i.test(label) ? 'inline' : 'other';
    return { type, label: label.replace(/^\d+\.\s*/, ''), file: field(b, 'Filename'), alt: field(b, 'Alt'), title: field(b, 'Title'), caption: field(b, 'Caption'),
      overlay: field(b, 'Overlay text \\(add[^)]*\\)') || field(b, 'Overlay text'),
      prompts: [...b.matchAll(/^\s*((?:Prompt[^:]*|Negative[^:]*)):\s*(.+)$/gm)].map((m) => [m[1], m[2]]) };
  }).filter((x) => x.file);
}

const files = [...(await walk('site/content/posts')), ...(await walk('site/content/articles'))].filter((f) => f.endsWith('.html')).sort();
const doc = [];
let todo = 0, done = 0;
for (const f of files) {
  let s = await readFile(f, 'utf8');
  const m = s.match(/IMAGE BRIEF[^\n]*\n([\s\S]*?)-->/);
  if (!m) continue;
  const items = parse(m[1]);
  const slug = path.basename(f, '.html');
  const url = f.includes('/articles/') ? `/${slug}/` : `/${path.relative('site/content/posts', f).replace(/\\/g, '/')}`;
  const [, fm, body0] = s.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let front = fm, body = body0;
  const feat = items.find((i) => i.type === 'featured');
  if (feat && !/^photo:/m.test(front)) front += `\nphoto: /images/${slug}/${feat.file}\nphotoAlt: ${feat.alt.replace(/\s+/g, ' ')}`;
  // Inline slots: at an existing INLINE IMAGE marker first, then before the 2nd, 4th and 6th H2.
  const inl = items.filter((i) => i.type === 'inline' && !body.includes(`<!--img:${i.file}|`));
  const slot = (i) => `<!--img:${i.file}|${i.alt.replace(/[|>]/g, ' ')}|${(i.caption || i.title).replace(/[|>]/g, ' ')}-->`;
  for (const [n, i] of inl.entries()) {
    if (body.includes('<!-- INLINE IMAGE -->')) { body = body.replace('<!-- INLINE IMAGE -->', slot(i)); continue; }
    const h2s = [...body.matchAll(/<h2[\s>]/g)].filter((x) => !/Frequently asked|bottom line/i.test(body.slice(x.index, x.index + 80)));
    const at = h2s[Math.min(1 + n * 2, h2s.length - 1)];
    if (at) body = body.slice(0, at.index) + slot(i) + '\n\n' + body.slice(at.index);
  }
  if (front !== fm || body !== body0) await writeFile(f, `---\n${front}\n---\n${body}`);

  const illus = (front.match(/^image:\s*(.+)$/m) || [])[1]?.trim();
  const status = (file) => (`/images/${slug}/${file}` === illus ? '🖼 illustration in place (upload a photo with the same name to replace it)'
    : existsSync(`site/images/${slug}/${file}`) ? '✅ uploaded' : '⬜ to do');
  const rows = items.filter((i) => i.type !== 'other');
  rows.forEach((i) => { const st = status(i.file); if (st.startsWith('✅')) done++; else if (st.startsWith('⬜') && i.type !== 'pin') todo++; });
  const title = (front.match(/^title:\s*(.+)$/m) || [])[1];
  doc.push(`## ${title}\n\n**Page:** https://www.homegardenlot.com${url} · **Upload to:** \`site/images/${slug}/\`\n`);
  for (const i of rows) {
    doc.push(`### ${i.type === 'featured' ? 'Featured (top of post, social, Pinterest)' : i.type === 'pin' ? 'Pinterest pin (upload to Pinterest, not the site)' : 'Inline image'} · ${i.type === 'pin' ? '' : status(i.file)}\n`);
    doc.push(`- **Filename:** \`${i.file}\``);
    if (i.alt) doc.push(`- **Alt text:** ${i.alt}`);
    if (i.title) doc.push(`- **Title:** ${i.title}`);
    if (i.caption) doc.push(`- **Caption:** ${i.caption}`);
    if (i.overlay) doc.push(`- **Overlay text:** ${i.overlay}`);
    doc.push(`- **Size:** ${(i.label.match(/\d{3,4}\s*[×x]\s*\d{3,4}[^,)]*/) || [''])[0] || 'see brief'}`);
    for (const [k, v] of i.prompts) doc.push(`- **${k}:** ${v}`);
    doc.push('');
  }
}
await writeFile('docs/IMAGE-BRIEFS.md', `# Image briefs

Every image the posts still need, generated from the IMAGE BRIEF in each post (re-run \`node scripts/site/image-briefs.mjs\` to refresh).

**How to add an image:** make it from a prompt (or take your own photo), export WebP, 1200 px wide, under ~150 KB (squoosh.app is free),
then on GitHub open the folder shown, **Add file → Upload files**, keep the exact filename, and commit. It appears in the right place
automatically on the next deploy (about a minute). A featured photo replaces the illustration. AI images: keep them clearly illustrative,
never presented as your own results (our Disclaimer promises this).

**Status:** ${done} uploaded · ${todo} to do

${doc.join('\n')}`);
console.log(`docs/IMAGE-BRIEFS.md: ${done} uploaded, ${todo} to do, across ${files.length} files scanned.`);
