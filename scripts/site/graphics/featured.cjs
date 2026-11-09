#!/usr/bin/env node
// Renders 1200x675 WebP featured images (title card + topic illustration) with Playwright.
// Usage: node scripts/site/graphics/featured.cjs scripts/site/graphics/batch.json
// batch.json: [{ "slug": "...", "kicker": "...", "title": "...", "sub": "...", "art": "lawn-water" }]
// Output: site/images/<slug>/<slug>.webp (needs Playwright + Chromium; Claude sessions have both).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GRASS = (y, n = 70, h = 60, c1 = '#3f8f4f', c2 = '#2f7a3f') => Array.from({ length: n }, (_, i) => {
  const x = 10 + i * (430 / n) + ((i * 37) % 7);
  const hh = h * (0.7 + ((i * 53) % 10) / 25);
  const lean = ((i * 29) % 9) - 4;
  return `<path d="M${x} ${y} Q${x + lean} ${y - hh / 2} ${x + lean * 2} ${y - hh}" stroke="${i % 2 ? c1 : c2}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}).join('');

const ART = {
  garlic: `<path d="M220 40 C214 90 214 120 220 150" stroke="#9aa86a" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M220 140 C240 175 360 220 370 310 C378 390 300 430 220 430 C140 430 62 390 70 310 C80 220 200 175 220 140 Z" fill="#f3ecdf" stroke="#cbb796" stroke-width="3"/><path d="M220 160 C190 230 185 330 220 428 M220 160 C255 230 260 330 220 428" stroke="#cbb796" stroke-width="3" fill="none"/>`,
  'lawn-water': `${GRASS(430)}<rect x="205" y="300" width="30" height="130" rx="6" fill="#52525b"/><rect x="185" y="280" width="70" height="34" rx="10" fill="#27272a"/>${[0, 1, 2, 3].map((r) => `<path d="M${220 - 60 - r * 45} ${280 - r * 10} Q220 ${120 - r * 30} ${220 + 60 + r * 45} ${280 - r * 10}" stroke="#4aa3df" stroke-width="5" stroke-dasharray="4 16" fill="none" stroke-linecap="round"/>`).join('')}`,
  'lawn-seed': `${GRASS(430, 40, 35)}<path d="M140 130 h160 l20 230 h-200 z" fill="#d9c08a" stroke="#a88a4e" stroke-width="4"/><rect x="150" y="190" width="140" height="80" rx="10" fill="#247b49"/><path d="M190 240 q30-40 60 0" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M220 240 v-30" stroke="#fff" stroke-width="7" stroke-linecap="round"/>${Array.from({ length: 26 }, (_, i) => `<ellipse cx="${60 + (i * 61) % 330}" cy="${385 + (i * 17) % 40}" rx="6" ry="3.5" fill="#c9a85c" transform="rotate(${(i * 47) % 180} ${60 + (i * 61) % 330} ${385 + (i * 17) % 40})"/>`).join('')}`,
  'lawn-fert': `${GRASS(430, 40, 35)}<path d="M130 110 h180 l16 260 h-212 z" fill="#f4f4f5" stroke="#a1a1aa" stroke-width="4"/><rect x="146" y="170" width="148" height="110" rx="10" fill="#247b49"/><text x="220" y="215" font-size="30" font-weight="800" fill="#fff" text-anchor="middle" font-family="Inter,Arial,sans-serif">N-P-K</text><text x="220" y="255" font-size="20" font-weight="700" fill="#d4ecdb" text-anchor="middle" font-family="Inter,Arial,sans-serif">LAWN FOOD</text>${Array.from({ length: 30 }, (_, i) => `<circle cx="${70 + (i * 53) % 320}" cy="${388 + (i * 13) % 36}" r="5" fill="${i % 3 ? '#3b82c4' : '#e0b93a'}"/>`).join('')}`,
  'lawn-calendar': `${GRASS(430, 40, 35)}<rect x="90" y="90" width="260" height="250" rx="20" fill="#fff" stroke="#d4d4d8" stroke-width="4"/><rect x="90" y="90" width="260" height="66" rx="20" fill="#247b49"/><rect x="90" y="130" width="260" height="26" fill="#247b49"/><rect x="140" y="70" width="14" height="44" rx="7" fill="#3f3f46"/><rect x="286" y="70" width="14" height="44" rx="7" fill="#3f3f46"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${112 + (i % 4) * 58}" y="${178 + Math.floor(i / 4) * 50}" width="44" height="36" rx="8" fill="${[3, 8, 9].includes(i) ? '#247b49' : '#e4e4e7'}"/>`).join('')}`,
  'lawn-measure': `${GRASS(430, 70, 40)}<circle cx="150" cy="300" r="90" fill="#f5b829" stroke="#c48f0f" stroke-width="6"/><circle cx="150" cy="300" r="34" fill="#27272a"/><path d="M230 330 h190 v34 h-190 z" fill="#fde68a" stroke="#c48f0f" stroke-width="4"/>${Array.from({ length: 19 }, (_, i) => `<path d="M${240 + i * 10} 330 v${i % 5 ? 10 : 18}" stroke="#78350f" stroke-width="2.5"/>`).join('')}`,
  'lawn-aerate': `<rect x="0" y="300" width="440" height="160" fill="#6b4a32"/>${GRASS(305, 60, 45)}${Array.from({ length: 6 }, (_, i) => `<rect x="${40 + i * 66}" y="${318 + (i % 2) * 40}" width="22" height="70" rx="11" fill="#4a3222"/><rect x="${36 + i * 66}" y="${270 + (i % 2) * 12}" width="30" height="20" rx="10" fill="#8a6446"/>`).join('')}`,
  'lawn-compare': `<rect x="10" y="150" width="200" height="280" rx="16" fill="#3f8f4f"/><rect x="230" y="150" width="200" height="280" rx="16" fill="#c8b37a"/>${GRASS(430, 30, 50).replace(/x1/g, '')}<text x="110" y="130" font-size="26" font-weight="800" fill="#1b2a1f" text-anchor="middle" font-family="Inter,Arial,sans-serif">COOL</text><text x="330" y="130" font-size="26" font-weight="800" fill="#1b2a1f" text-anchor="middle" font-family="Inter,Arial,sans-serif">WARM</text><circle cx="330" cy="70" r="30" fill="#f5b829"/><path d="M95 55 l15 25 l15 -25 M110 40 v50" stroke="#4aa3df" stroke-width="6" fill="none" stroke-linecap="round"/>`,
};

const page = ({ kicker, title, sub, art }) => `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0}.c{width:1200px;height:675px;position:relative;overflow:hidden;font-family:Inter,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:linear-gradient(135deg,#f3efe6 0%,#e7f2ea 55%,#d4ecdb 100%)}
.soil{position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(#6b4a32,#4a3222)}
.t{position:absolute;left:72px;top:92px;width:600px}.k{display:inline-block;background:#247b49;color:#fff;font-weight:700;font-size:20px;letter-spacing:.12em;padding:8px 16px;border-radius:8px}
h1{font-size:${title.length > 34 ? 62 : 72}px;line-height:1.04;margin:24px 0 18px;color:#1b2a1f;letter-spacing:-.03em}p{font-size:28px;margin:0;color:#3f3f46;font-weight:600}
.b{position:absolute;left:72px;bottom:40px;color:#f3efe6;font-weight:700;font-size:22px}svg{position:absolute;right:60px;top:60px}</style></head>
<body><div class="c"><div class="soil"></div><div class="t"><span class="k">${kicker}</span><h1>${title}</h1><p>${sub}</p></div>
<svg width="440" height="470" viewBox="0 0 440 470">${ART[art]}</svg><div class="b">homegardenlot.com</div></div></body></html>`;

(async () => {
  const list = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 675 } });
  for (const it of list) {
    if (!ART[it.art]) throw new Error(`Unknown art "${it.art}"; choose one of ${Object.keys(ART).join(', ')}`);
    await p.setContent(page(it));
    const png = await p.screenshot({ type: 'png' });
    const webp = await p.evaluate(async (b64) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = document.createElement('canvas'); c.width = 1200; c.height = 675; c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', 0.86).split(',')[1];
    }, png.toString('base64'));
    const out = path.join('site/images', it.slug, `${it.slug}.webp`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(webp, 'base64'));
    console.log(out, Math.round(fs.statSync(out).size / 1024) + ' KB');
  }
  await b.close();
})();
