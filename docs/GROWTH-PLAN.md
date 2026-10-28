# Growth plan: what to build next and why

Ranked by expected traffic and revenue per hour of work. Volumes are US monthly searches (Ubersuggest, Oct 2026).

## 1. Planting calendar by ZIP code (highest-leverage tool)
**What:** enter a ZIP code → USDA zone + average last/first frost dates → a personal "when to plant" table for ~30 vegetables (start indoors / transplant / direct sow), plus a printable view.
**Why:** one tool page plus crop pages captures a huge seasonal cluster:
"when to plant tomatoes" 8,100 avg (**27,100 in Mar–Apr**), "last frost date" 4,400 avg (**18,100 in March**), "planting calendar" 1,900, plus "when to plant [crop]" for dozens of crops.
**Mechanism:** tool pages earn links and repeat visits (people come back every spring), and each crop gets its own "When to plant X" post linking to the tool, which builds topical authority.
**Cost:** $0. Zone lookup from the free public `phzmapi.org` ZIP→zone data; frost dates from NOAA 1991–2020 climate normals (public domain). Built like the mulch calculator (one paste-in Blogger page).
**Timing:** must be live and indexed by **early January** to catch the February–April peak.

## 2. Pinterest from day one (fastest free US traffic)
- Business account (free) → claim homegardenlot.com → enable Rich Pins.
- Every post's IMAGE BRIEF already includes a 2:3 pin. Make 3–5 pin variations per post over time (different hook text), 3–5 pins a day via Pinterest's free scheduler.
- **Mechanism:** Pinterest is a visual search engine with a huge US gardening audience; pins send traffic for months, independent of Google. Realistic: first clicks in 2–4 weeks, meaningful traffic in 3–6 months.

## 3. Email list (owned audience)
- Free tier of MailerLite or Kit (both free up to 1,000 subscribers).
- Lead magnet: a printable **"Garden Quantity Cheat Sheet"** PDF (mulch/soil/gravel coverage tables you already have).
- Put the signup box under each calculator result and at the end of posts.
- **Mechanism:** spring reminder emails ("time to mulch / overseed / start tomatoes") bring repeat traffic at the exact peak, so RPM goes up without new content.

## 4. AdSense setup that doesn't hurt Core Web Vitals
- Apply only when the weekly **Site audit** shows ✅ (25+ substantial posts, legal pages, no critical issues).
- Manual ad units in the theme's reserved slots; **no ads above the Quick answer**, max ~3 in-content units per post, no anchor/vignette on mobile at first. Auto ads cause most of the layout shift on Blogger sites.
- Add `ads.txt` via Blogger → Settings → Monetization once approved.

## 5. Affiliate layer on the calculators (after AdSense)
- Amazon Associates (free) on tool result panels: "Need 14 bags? Here's the mulch / spreader / wheelbarrow we'd use" with an honest disclosure.
- **Mechanism:** someone who just calculated a quantity has strong buying intent; tool pages typically convert far better than articles.

## 6. Refresh before peaks
- Every January–February: update the top 10 spring posts (prices, "Last reviewed" date, new FAQ from Search Console queries). The weekly audit flags posts not updated for a year.
- **Mechanism:** freshness plus real query data from Search Console lifts rankings right before demand spikes.

## 7. Search Console and Bing (free, 10 minutes)
- Google Search Console: verify, submit `sitemap.xml` and `sitemap-pages.xml`, check **Manual actions** and **Core Web Vitals** monthly.
- Bing Webmaster Tools: import from Search Console. Bing powers ChatGPT search and DuckDuckGo results, which helps AI citations.

## Weekly routine (about 30 minutes)
1. Monday: open the **Site audit** report (`reports/site-audit.md`) and fix anything critical.
2. Publish 1–2 posts a day from drafts (photo + experience line + permalink + description).
3. Pin 3–5 images a day on Pinterest.
4. Once a month: check Search Console queries and add new FAQs to posts that get impressions.
