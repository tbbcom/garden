# homegardenlot.com — Full SEO / CWV / E-E-A-T Audit & Rebuild Plan

_Audit date: 27 Oct 2026 · Target market: USA first, global English second_

> **Scope note:** The live site could not be crawled from the audit environment (network policy blocked `homegardenlot.com`). Findings come from Ubersuggest (US) performance and keyword data, the code in `tbbcom/garden` and `tbbcom/garden-calc`, and the current theme XML you uploaded (audited line by line in §2b). The new theme (`blogger/homegardenlot-theme.xml`, v2.1.0) is a full replacement that keeps your brand look: green `#247b49`, zinc neutrals, the Inter font and the dark forest-green footer.

---

## 1. What the data says (measured)

| Metric | Value | Verdict |
|---|---|---|
| Mobile LCP | **10.4 s** | ❌ Fail (target ≤ 2.5 s) |
| Mobile CLS | **0.749** | ❌ Severe (target ≤ 0.1) — 7× the limit |
| Mobile FCP | 3.9 s | ❌ |
| Mobile TBT | 16 ms | ✅ |
| Desktop LCP / CLS | 2.3 s / 0.054 | ✅ borderline |
| Redirect cost | 1.4 s mobile | ❌ apex → www hop |
| Unused JS | ~304 KB | ❌ |
| Domain Authority | 6 | Low |
| Referring domains | 106 (278 links) | OK base |
| Ranking keywords (US) | 101 (Nov 2025) → **2** (Sep 2026) | ❌ Collapse |
| Organic traffic | ~0 | ❌ |

**Read-out:** the site lost almost all of its rankings between Nov 2025 and Jan 2026. Three likely causes, all fixable:
1. **Spammy structured data**: the calculator page shipped a made-up `AggregateRating` (4.9★ from 287 ratings) that no real reviews back up. Google's policy treats self-serving, fabricated review markup as spam, and it can lead to a manual action or a site-wide trust downgrade. **Removed in this PR.**
2. **Factual error on the money page**: the FAQ (and its FAQPage schema) said a 4×8 ft bed at 12 in deep needs 10.67 cu ft. The correct figure is **32 cu ft**, and the calculator itself returns 32. A tool that contradicts its own FAQ hurts Helpful Content and E-E-A-T signals. **Fixed.**
3. **Mobile CWV failing badly**: a CLS of 0.749 typically comes from images without dimensions, ads injected without reserved space, and web-font swaps. **Fixed in the theme** (see §3).

### Do these in Google Search Console today (free, 15 min)
- **Security & Manual actions → Manual actions.** If anything is listed, file a reconsideration request once this PR is live. State that the fabricated rating markup was removed.
- **Indexing → Pages**: export the "Crawled – currently not indexed" list. These are the thin posts to merge or improve.
- **Settings → Crawl stats**: confirm Googlebot isn't hitting endless `?updated-max=` / `/search?q=` URLs (handled by the new robots.txt).

---

## 2. Critical issues → fix status

| # | Issue | Impact | Status |
|---|---|---|---|
| 1 | Fabricated `aggregateRating` in tool schema | Manual-action / trust risk | ✅ Removed (`garden-calc/index.html`) |
| 2 | Wrong soil numbers in FAQ + FAQPage schema | E-E-A-T, misinformation | ✅ Fixed |
| 3 | Content targeted Malaysia/Singapore on a US-market tool | Wrong geo relevance | ✅ Rewritten for US (USDA zones, TX/AZ/FL) |
| 4 | `screenshot` URL that can't exist on Blogger (`/images/...`) | Schema error | ✅ Removed |
| 5 | Mobile CLS 0.749 / LCP 10.4 s | Ranking + ad RPM | ✅ New theme |
| 6 | No sitewide Organization/WebSite graph, no author entity | E-E-A-T / Knowledge Graph | ✅ New theme |
| 7 | Internal search & archive pages indexable (typical Blogger default) | Crawl waste, thin pages | ✅ `noindex,follow` + robots.txt |
| 8 | Apex → www redirect costs 1.4 s | TTFB / LCP | ⚠️ Settings: always link to `https://www.` (see §5) |
| 9 | 6-in-1 tabbed calculator can only rank for one head term | Leaves 60k+/mo searches unclaimed | 📋 Roadmap §7 |
| 10 | Service worker in `garden` repo can't run on Blogger (no root file hosting) | PWA doesn't work on www | 📋 Move to the tools subdomain (§6) |

---

## 2b. Line-by-line audit of the current theme XML (uploaded, 3,545 lines / 255 KB)

| # | Finding in current XML | Why it hurts | New theme |
|---|---|---|---|
| 1 | jQuery 3.6.0 loaded from cdnjs (~90 KB) | Main source of the ~300 KB "unused JavaScript"; delays interaction | No jQuery; one ~5 KB vanilla IIFE |
| 2 | Bootstrap Icons CSS + icon font from cdnjs | Render-blocking CSS plus a ~100 KB font only used for icons → slow FCP/LCP | No icon font; text buttons |
| 3 | Inter loaded as a render-blocking Google Fonts stylesheet, up to 3 families × 400–700 incl. italics | Blocks first paint on mobile 4G | Inter 400/600/700 only, non-blocking (`media=print` swap); system-ui paints first |
| 4 | 5 widgets render posts client-side via `{getPosts}` (menu "Tips & Trick", "You Might Like", "Latest Posts" …) | Content injected after load = layout shift (CLS 0.749) and invisible to non-JS crawlers | Server-rendered cards/popular posts; only related posts lazy-load inside a reserved 320 px box |
| 5 | In-feed AdSense units with `data-ad-format='fluid'` and no reserved height | Ads push content down on load → major CLS | Ad slots reserve `min-height:280px` |
| 6 | `<title>` is `data:view.title` everywhere | Homepage, label and search pages all get generic titles | Templated titles per view type |
| 7 | Meta description and `index` on every view, incl. `/search?q=` and archives | Thin/duplicate pages in the index | `noindex,follow` on search, archive and 404 |
| 8 | Two `WebSite` schemas (custom + `pbt-head`) and a separate `Organization`; `http://schema.org` | Conflicting entity data | One `@graph` linking Organization ↔ WebSite ↔ BlogPosting by `@id` |
| 9 | `SearchAction` sitelinks-searchbox markup | Google retired that feature in Nov 2024; dead weight | Removed |
| 10 | Label breadcrumb `item` built from the raw label (`search/label/Decor & Design`) | Spaces and `&` produce invalid URLs in structured data | Uses Blogger's encoded `data:label.url` |
| 11 | 6 `hreflang` tags (en, en-us, en-gb, en-ca, en-au, x-default) all pointing at the same URL | No benefit for a single-language site; adds noise and Search Console warnings | Removed; `og:locale en_US` + `inLanguage en-US` |
| 12 | Two `viewport` meta tags | Invalid duplicate | One |
| 13 | `manifest.json` loaded cross-origin from `tbbcom.github.io` | The manifest's `start_url` resolves to github.io, so the PWA can't install for `www` | Removed from the theme; host the PWA on the tools subdomain (§6) |
| 14 | Leftover vendor promo widget (`pbt-ad` → probloggertemplates.com "Spotlight") | External commercial link left in the theme | Removed |
| 15 | Author avatar falls back to a generic image; there is no author bio box | Weak E-E-A-T | Author box with bio, About, Editorial Policy and corrections links |

**Kept from your theme:** the brand palette, Inter, logo images, `fb:app_id`, the Bing `msvalidate.01` verification tag, the social profiles (now in the Organization `sameAs`), and every tool page link.

---

## 3. New theme: `blogger/homegardenlot-theme.xml`

### Install (5 min)
1. Blogger → **Theme → ▾ → Backup** (download your current XML first).
2. **Theme → ▾ → Restore** → upload `homegardenlot-theme.xml`.
3. **Layout**: fill in the widgets:
   - **Main Menu** (LinkList1): 5–7 hub links (see the §4 taxonomy), e.g. `/search/label/Vegetable%20Gardening`.
   - **Topic Hubs** (homepage chips): the same hub links.
   - **Popular Topics** (footer): the top 4–6 hubs.
   - **Ad: Sidebar top**: paste your AdSense unit (the slot reserves 280 px so it can't cause CLS).
4. Create the trust pages the theme links to (all `/p/` pages): `about`, `editorial-policy`, `contact`, `privacy-policy`, `terms`, `disclaimer`.
5. Blogger profile → fill in **About me** and upload a real photo. The author box on every post shows them.

### What it does and the mechanism behind each choice
| Area | Implementation | Ranking mechanism targeted |
|---|---|---|
| **CWV: CLS** | Every theme image has `width`/`height` + `aspect-ratio`; ad slots reserve height; no web fonts (system serif/sans stack); TOC is server-rendered, so JS only fills it | CLS < 0.1 → passes the Page Experience signal; higher ad viewability |
| **CWV: LCP** | First card image `loading=eager` + `fetchpriority=high`, responsive `srcset` via `sourceSet()` (Blogger's resizer), preconnect to `blogger.googleusercontent.com`; every other image lazy | LCP < 2.5 s on 4G |
| **Weight** | `b:css='false'` drops Blogger's default widget CSS bundle; one ~10 KB inline CSS file; one vanilla IIFE (~5 KB), no jQuery, no Font Awesome | Less unused CSS/JS, faster FCP |
| **TTFB** | No render-blocking third-party requests in `<head>` | Blogger's TTFB is Google-hosted and fast; the theme stops adding to it |
| **Indexing** | Canonical on every view; `noindex,follow` on `/search?q=`, archives, 404; `max-image-preview:large` | Clean index; large-image eligibility in Discover |
| **Schema** | `@graph` with Organization + WebSite (sitewide); BlogPosting (headline, dates incl. `dateModified`, 1200 px image, Person author → `/p/about.html`, section, keywords) + BreadcrumbList on posts; CollectionPage on label hubs; WebPage on static pages | Article rich results, breadcrumb SERP trail, entity linking for AI Overviews |
| **E-E-A-T** | Byline linked to About, "Updated" date (shown only when meaningfully edited), author box linking credentials, editorial policy and a corrections contact | Experience/trust signals that raters and LLMs look for |
| **AEO / LLM** | Editorial classes for the post editor: `.hgl-answer` (40–60-word direct answer), `.hgl-takeaways`, comparison tables, `.hgl-faq`, `.hgl-sources` (see `blogger/post-template.html`) | Featured snippet, People Also Ask, citation in AI Overviews / ChatGPT / Perplexity |
| **Internal linking** | Breadcrumbs (Home › Hub › Post), related posts from the same hub (lazy-loaded JSON feed), topic chips, popular posts | Topical authority via hub silos; deeper crawl |
| **Pinterest** | "Pin it" is the primary share button, pinning the featured image | Pinterest is the #1 free traffic source in the US garden niche |
| **Accessibility** | Skip link, landmark roles, `aria-expanded` mobile menu, focus rings, dark mode via `prefers-color-scheme` | UX and quality signals |

### Old-theme shortcodes (still in existing posts)
The theme converts them in place with vanilla JS, so no post needs editing:

| Shortcode | Becomes |
|---|---|
| `{getToc} $title={…} $expanded={true}` | The theme's table of contents, at that exact spot (without it, the TOC goes just before the first H2) |
| `{getButton} $text={…} $color={…}` (on a link) | Styled button that keeps the link |
| `{getCard} $type={post} $title={…}` (on a link) | Internal-link card with the post's thumbnail |
| `{getCard} $type={download/product/custom}` | Card with title, info and button text |
| Blockquote `{alertSuccess}` `{alertInfo}` `{alertWarning}` `{alertError}` `{codeBox}` | Colored alert box / code box |
| `{contactForm}` | Blogger contact form (ContactForm1 widget) |
| `{inAds}` `{ads}` `{showAds}` `{nextPage}` sidebar codes | Removed (in-article ads cause CLS; use reserved slots instead) |
| Any other `{getX}` | Hidden, never shown as raw text |

For **new** posts, write plain HTML instead (see `blogger/post-template.html`). Google reads the raw anchor text of a `{getCard}` link as `{getCard} $type={post} $title={…}`, which is useless as internal-link anchor text. When you update an old post, replace the shortcode link text with the real title, e.g. `<a href="…">How to Grow Cucumbers</a>`.

> **Blogger quirk:** Blogger always lists a post's labels **alphabetically**. The theme uses the first label for the breadcrumb and related posts, so give each post **one hub label** (§4).

---

## 4. Label (category) taxonomy

**Problem pattern on Blogger sites:** dozens of one-off labels (plural/singular duplicates, "Tips", "Garden Ideas", "gardening"), each producing a thin page. Google sees hundreds of near-empty pages.

**New system: 10 hub labels, one per post.**

| Hub label (exact text) | Covers | Seed US keywords |
|---|---|---|
| Vegetable Gardening | planting, harvest, varieties | when to plant tomatoes, companion planting chart |
| Raised Beds & Soil | beds, soil, compost, mulch | raised bed soil calculator (6.6k), how much mulch do I need |
| Lawn Care | grass, seeding, weeds, mowing | when to overseed lawn, grass seed calculator |
| Landscaping | design, edging, rock, shrubs | landscape rock calculator, front yard ideas |
| Flowers & Plants | perennials, shrubs, bulbs | when to plant bulbs, deer resistant perennials |
| Houseplants | indoor plants, care | why are my plant leaves turning yellow |
| Pests & Plant Problems | insects, disease, deficiencies | how to get rid of aphids naturally |
| Outdoor Living | patios, decks, fences, sheds | paver calculator, fence cost |
| Home Improvement | DIY, repairs, paint, flooring | paint calculator, how much concrete do I need |
| Tools & Gear | reviews, buying guides (affiliate) | best cordless leaf blower |

**Mapping your current labels** (taken from the menu and widgets in your XML):

| Current label | → New hub label |
|---|---|
| Gardening, Garden Maintenance | Flowers & Plants (or Vegetable Gardening if edible) |
| Vegetable, Edible Garden, Organic Gardening | Vegetable Gardening |
| Composting | Raised Beds & Soil |
| Lawn Care | Lawn Care |
| Home Improvement | Home Improvement |
| Decor & Design, Interior Design | Home Improvement (or keep "Decor & Design" as an 11th hub if it has 10+ posts) |
| Sustainability | Merge into the closest practical hub (rain barrels → Outdoor Living, composting → Raised Beds & Soil) |
| Lifestyle, inspiration | Retire (too vague to rank); redistribute posts and set a custom redirect |

**Migration rules**
1. Blogger → Posts → filter by each old label → bulk-apply the new hub label, then remove the old label.
2. A hub with fewer than 5 posts gets merged into its nearest hub.
3. Add a 150–250-word **pillar page** per hub (e.g. `/p/raised-bed-gardening-guide.html`) that links to every post in it. Label pages list posts; pillar pages rank.
4. Before deleting a label that has backlinks, use Settings → Errors and redirections → **Custom redirects** to send `/search/label/Old` to the new hub.

---

## 5. Blogger settings checklist

| Setting | Value |
|---|---|
| Publishing → Custom domain | `www.homegardenlot.com`, **Redirect domain ON** |
| HTTPS → HTTPS availability / redirect | ON / ON |
| Meta tags → Enable search description | ON; write one for the blog and for **every** post (150–160 chars, keyword first) |
| Crawlers → Custom robots.txt | ON → paste `blogger/robots.txt` (welcomes GPTBot/PerplexityBot/ClaudeBot for AI citations; blocks `/search?q=`) |
| Crawlers → Custom robots header tags | **OFF** (the theme handles robots meta; ON would create conflicting duplicates) |
| Errors → Custom 404 | leave empty (the theme renders a search-led 404) |
| Comments | "Users with Google Accounts" + moderation → stops spam links |
| Formatting → Time zone | your real zone; date format `Month D, YYYY` |
| Google Analytics | GA4 `G-` ID (free) |
| Monetization | AdSense **manual units** in reserved slots; if you use Auto ads, turn **off** anchor and vignette on mobile, the main CLS offenders |

**Redirect fix (1.4 s):** you can't remove Blogger's apex → www redirect. Make sure **every** link points straight to `https://www.homegardenlot.com/...`: GSC property, sitemap, Pinterest pins, social bios and backlink outreach. Then real users never take the redirect hop.

---

## 6. Subdomain strategy: lead recommendation

**Don't put articles on the subdomain.** At DA 6, splitting content across `www` and a subdomain divides the little authority you have. Google evaluates subdomains largely as separate sites for quality signals.

**Recommended architecture**

```
www.homegardenlot.com        (Blogger)     articles, hubs, AND the ranking tool pages
  /p/mulch-calculator.html                 ← tool UI + 800–1200 words + FAQ, JS from jsDelivr
  /p/raised-bed-soil-calculator.html
tools.homegardenlot.com      (Cloudflare Pages — free)
  /                                        app-style hub, PWA (sw.js works here), embeds, llms.txt
```

- **Tool JS hosting (free):** serve `garden-calc` assets via jsDelivr: `https://cdn.jsdelivr.net/gh/tbbcom/garden-calc@<tag>/assets/garden-calculator.min.js`. Pin a git tag for cache-busting. Cost $0, global CDN, no Blogger file-hosting limits.
- **Subdomain host:** Cloudflare Pages (free, unlimited bandwidth) connected to `tbbcom/garden`. Add a `CNAME tools → <project>.pages.dev` record. It gives full control of headers, `sw.js`, `manifest.json`, `llms.txt` and true sub-200 ms TTFB.
- **No duplication:** each tool's indexable page lives in **one** place. If the same tool appears on both, canonicalise the subdomain copy to the `www` page.
- Add the subdomain as its own GSC property and sitemap.

---

## 7. Highest-ROI growth plan (Nov 2026 → May 2027)

**Seasonality is the opportunity.** US search volume (Ubersuggest):

| Keyword | Avg / mo | Peak (Apr–May) | KD |
|---|---|---|---|
| mulch calculator | 60,500 | **165,000** | 26 |
| raised bed soil calculator | 6,600 | **18,100** | 30 |

Both are low-difficulty, high-volume and peak in **spring 2027**. Pages need ~3–4 months to index and climb, so **they must be live by February**.

| When | Action | Expected outcome |
|---|---|---|
| Week 1 | Install theme, robots.txt, settings, GSC manual-action check | CWV pass in CrUX within ~28 days; crawl cleanup |
| Week 1–2 | Relabel into 10 hubs; write About + Editorial Policy with real experience and photos | E-E-A-T baseline |
| Nov–Dec | **Split the 6-in-1 calculator into separate pages**: mulch, raised bed soil, topsoil, compost, plant spacing, fertilizer, then add paver, concrete, paint and grass seed (home improvement). One tool = one keyword = one URL | Each page can rank for its own head term instead of one page competing for six |
| Nov–Jan | 2 supporting articles per tool ("how much mulch do I need", "mulch depth guide") linking to the tool via `.hgl-tool-cta` | Topical cluster → tool page authority |
| Dec–Feb | 10 Pinterest pins per tool/article (Canva free) | Fast, Google-independent US traffic |
| Feb | Outreach: get tools listed on 10–20 US extension/garden-club/resource pages ("free garden calculators") | Quality backlinks; DA uplift |

**Realistic revenue mechanism:** reaching positions 5–10 for "mulch calculator" at the spring peak means ~2–4% CTR × 165k ≈ **3,000–6,500 visits/mo** from that one keyword. At a typical US home-and-garden AdSense RPM of ~$8–20, that is **~$25–130/mo from a single tool page at peak**. Ten tools plus articles scale that linearly. Timeline: 4–8 months at DA 6; faster if the backlink outreach lands.

---

## 8. Files in this PR

| File | Purpose |
|---|---|
| `blogger/homegardenlot-theme.xml` | Complete replacement Blogger theme |
| `blogger/robots.txt` | Custom robots.txt for Blogger settings |
| `blogger/post-template.html` | AEO/E-E-A-T article skeleton for the post editor |
| `docs/SEO-AUDIT.md` | This document |
| `garden-calc/index.html` (separate PR) | Removed fake rating schema, fixed FAQ math, US targeting |
