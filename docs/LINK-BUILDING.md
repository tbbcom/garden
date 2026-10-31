# Ranking playbook: links, citations and the on-page work already done

_For tools.homegardenlot.com and www.homegardenlot.com · Written 31 Oct 2026 · White-hat only: nothing here risks a manual action or AdSense._

## The honest picture
The tools now beat most of what ranks: more units, several shapes, the math shown, a diagram, sharing and printing, plus sources. What the site lacks is **authority** (DA 7). In SERPs where DA 4–20 sites already hold the top 5 (concrete block, sod, stairs, pool volume, mulch), you need **roughly 10–30 relevant linking domains** to the tool site, not hundreds. The cheapest way to get them is to give site owners something useful to put on their own pages.

**Don't do these:** buy links, use PBNs, run link exchanges, spam comments or forums, use keyword-stuffed widget anchors, generate AI "guest posts" in bulk, or add fake review or star schema. Each one can undo all of this. The fabricated rating schema is the likely cause of the 2026 traffic collapse (see SEO-AUDIT.md).

---

## Already built into the site (nothing to do)
| What | Why it ranks | Where |
|---|---|---|
| **Quick answer** box at the top of every tool | Its first sentence is the line Google's AI Overviews, featured snippets and ChatGPT quote | Every tool page |
| **Reference tables** (blocks per wall size, sod per lawn size, seed per grass type, zones by state) | They answer long-tail questions ("how many blocks for a 10x8 wall") in a format Google lifts into snippets | Every tool page |
| **FAQ + FAQPage schema** | Feeds People Also Ask; AI parsers read the clean Q&A pairs (Google no longer shows FAQ rich results for this site type) | Every tool page |
| **Show the math + sources** | E-E-A-T trust signal, and the formula is what answer engines cite | Every calculator |
| **WebApplication + BreadcrumbList schema**, no ratings | Correct entity data, zero spam risk | Every tool page |
| **Related tools** block + **embed offer** on each page | Spreads link equity across the cluster and asks for links | Every tool page |
| **Shareable result links** (state in the URL) | People paste their result into forums and texts, which brings natural mentions | Calculators |
| **llms.txt** listing every tool with its key numbers | Lets AI crawlers find and summarize the tools | `/llms.txt` |
| **IndexNow ping on every deploy** | Bing recrawls within hours; Bing's index feeds ChatGPT search and Copilot | Deploy workflow |
| **Embeds for 5 tools** with a branded credit link | The link-building engine below | `/embed/` |
| **Free CC BY dataset** (frost dates CSV) + Dataset schema | Journalists and teachers cite data | `/data/` |

---

## The link plan: 30 minutes a day, highest return first

### 1. Embed outreach (target: 10–20 linking sites in 90 days)
Every embed carries `Free … calculator by <a href="(tool URL)">Home Garden Lot</a>` in the host page's HTML. That is a real, editorially placed link from a relevant site. The anchor is your brand on purpose: Google's link-scheme guidance flags **keyword-rich** widget links, and a branded anchor is safe.

**Who to email** (all free to find with Google):
| Tool | Prospects | Google search to find them |
|---|---|---|
| Frost dates | Garden clubs, Master Gardener chapters, community gardens, school garden programs, small nurseries | `"master gardener" "frost dates"` · `"community garden" "planting calendar" "resources"` · `"garden club" inurl:links` |
| Concrete block / retaining wall | Landscape and hardscape contractors, masonry supply yards, small block retailers | `"retaining wall" contractor "resources"` · `"masonry supply" "calculator"` · `"landscape supply" "how much do I need"` |
| Sod / grass seed | Lawn-care companies, sod farms without a calculator, local seed and feed stores | `"sod farm" "contact"` · `"lawn care" "resources" "calculator"` · `"feed and seed" grass seed` |

**Email template** (personalize the first line; send 5–10 a day):
> Subject: Free [sod] calculator for [Business name]'s site
>
> Hi [name], I saw your [page/service] for [town]. We built a free [sod calculator](https://tools.homegardenlot.com/sod-calculator/) that works out square feet, pallets and slabs for odd-shaped yards. You can put it on your site with one line of code (no ads, no tracking): https://tools.homegardenlot.com/embed/#sod
>
> It might save you a few "how much do I need?" calls. Happy to adjust anything, for example your pallet size as the default.
> [Your name], Home Garden Lot

**Mechanism:** contractors and farms get a useful widget for free; you get a link from a topically relevant local business site. Expect 5–10% to say yes. If one asks for their own defaults (pallet size, price), say yes: it is a one-line config change.

### 2. Resource-page and broken-link outreach (target: 5–10 links)
University extension, library, school and city sites keep "gardening resources" link lists, and many point to dead calculators.
- Find them: `"gardening resources" "frost" site:.org` · `"lawn" "resources" "calculator" site:.gov` · `intitle:resources "raised bed" site:.edu`
- Check them with the free **Check My Links** Chrome extension. When a link is dead, email the page owner: "Your link to X is broken; here is a working free alternative," and point to the matching tool.
- **Mechanism:** you fix their page, so they have a reason to link. Links from .edu, .gov and .org resource pages carry strong trust signals.

### 3. Data stories for press links (target: 2–5 high-authority links per season)
Your frost and zone pages contain real, local, newsworthy facts, and local TV weather teams and garden columnists need them every spring and fall.
- **Pitch hooks taken from your own pages:**
  - "In Colorado, towns in the same hardiness zone (6a) get their last frost anywhere from April 24 to June 11."
  - "[City]'s first frost is on average [date]: here's every town in [state]."
- **Who:** local TV meteorologists (most list an email), newspaper garden columnists, state extension newsletters, regional magazines.
- **When:** pitch in **mid-February** (last-frost stories) and **mid-August** (first-frost and fall-seeding stories).
- **Journalist request platforms** (check what each free tier allows when you sign up): Qwoted, SourceBottle and Featured.com (which now runs HARO). Answer only gardening, lawn and home-improvement questions, with a specific number and a link to the matching tool.
- **Mechanism:** a news site citing your data gives the biggest authority lift per link, and the citation often repeats every year.

### 4. Communities: traffic now, AI citations later (nofollow, still worth it)
Reddit and forum threads are heavily cited by Google AI Overviews, ChatGPT and Perplexity.
- **Where:** r/lawncare, r/landscaping, r/vegetablegardening, r/gardening, r/DIY, r/HomeImprovement, plus the GardenWeb/Houzz forums.
- **How:**
  - answer the question in full in the comment first, with the number;
  - link the tool only when it does the exact job (for example "here's the math for your 3 ft wall: [shareable result link]");
  - stay under one link per ~10 helpful comments, and follow each subreddit's self-promotion rules.
- **Mechanism:** the shareable result links make your answer verifiable. Upvoted answers get scraped into AI answers that name your site.

### 5. Pinterest (free, US-heavy, long tail)
- One pin per reference table: "How many concrete blocks do I need? (chart)", "Sod per lawn size", "Grass seed per 1,000 sq ft". Use 2:3 images with the table on them, linking to the tool.
- 3–5 pins a day with Pinterest's free scheduler; re-pin new variations every month before each season.
- **Mechanism:** charts get saved and re-pinned for years; Pinterest sends steady clicks and image-search visibility independent of Google rank.

### 6. Internal links from the blog (free, immediate)
Every Blogger post in `content/PLAN.md` should link its tool with descriptive anchor text in the first 150 words and again in the tool CTA:

| Posts | Link to (anchor text) |
|---|---|
| Lawn posts (#1–9) | [grass seed calculator](https://tools.homegardenlot.com/grass-seed-calculator/) · [sod calculator](https://tools.homegardenlot.com/sod-calculator/) |
| Hardscape posts (#31–38) | [concrete block calculator](https://tools.homegardenlot.com/concrete-block-calculator/) · [retaining wall calculator](https://tools.homegardenlot.com/retaining-wall-calculator/) |
| Crop / "when to plant" posts | [frost dates by ZIP code](https://tools.homegardenlot.com/frost-dates/) · [hardiness zone by ZIP code](https://tools.homegardenlot.com/hardiness-zones/) |

**Mechanism:** your 106 existing referring domains point at www; internal links pass some of that authority to the tools subdomain and tell Google which page answers which query.

---

## Search engines: one-time setup (free, about 20 minutes)
1. **Google Search Console:** a Domain property for `homegardenlot.com` covers the subdomain. Submit `https://tools.homegardenlot.com/sitemap.xml`, then use URL Inspection → **Request indexing** for each new tool URL (the limit is about 10 a day, so start with the calculators).
2. **Bing Webmaster Tools:** import from Search Console. IndexNow is already automated; Bing is the index behind ChatGPT search, Copilot and DuckDuckGo.
3. **Monthly:** in Search Console → Performance, filter by page and look at queries with impressions but position 8–20. Add each one as an FAQ or a table row on that page. This is the single most reliable way to climb from page 2 to page 1.
4. **Every January:** bump the seed and sod prices and "data updated" dates, and re-request indexing for the lawn tools before the March–May peak.

## What to expect
- **Weeks 1–4:** tools indexed; impressions start in Search Console; Bing and ChatGPT search pick them up first.
- **Months 2–3:** with 5–10 relevant links, the low-competition SERPs (concrete block, sod, retaining wall, state zone queries) move onto page 1.
- **Months 4–6:** with 15–30 links plus seasonal demand, aim for top 3 in those SERPs and page 1 on gravel, stairs and grass seed. Head terms owned by USDA, Lowe's or paint brands stay out of reach; that is expected.

Track it in a simple sheet: date, prospect, tool, sent, reply, link live (URL). Review it every Monday alongside the site audit.
