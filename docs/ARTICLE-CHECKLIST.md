# Pre-publish checklist (every post)

What's already built into each file in `content/posts/`, and the 5-minute part only you can do in the Blogger draft.

## Already in the file (done by the writer)

| Area | What's there | Ranking mechanism |
|---|---|---|
| **AEO / AI answers** | 40–60-word "Quick answer" box directly under the title | Featured snippet, Google AI Overviews, ChatGPT/Perplexity citations |
| **People Also Ask** | Question-phrased H2s + FAQ with 1–3 sentence answers | PAA boxes, long-tail queries |
| **LLM citability** | Self-contained facts with numbers, comparison tables, named sources | AI models quote pages with concrete, checkable data |
| **Topical authority** | 3+ links to the matching calculator + related tools | Internal links pass relevance to money pages |
| **On-page SEO** | Title ≤ 65 chars with the main keyword first; 150–160-char description; one H1 (the title) | Click-through rate, relevance |
| **Schema** | The theme adds BlogPosting (author, dates, image) + BreadcrumbList automatically | Article and breadcrumb rich results |
| **Trust** | Sources line + "Last reviewed" date; the theme adds the author box | E-E-A-T (Trust) |
| **One label** | Exactly one hub label (Blogger sorts labels A–Z and the theme uses the first one for breadcrumbs and related posts) | Clean topic silo |

## Your 5 minutes in the Blogger draft

1. **Permalink → Custom** = the file name without `.html`.
2. **Search Description** = the `description:` line from the file.
3. **Featured image (this is the LCP element):**
   - Use your own photo, 1200–1600 px wide, saved as WebP/JPG under ~150 KB (free: squoosh.app).
   - Make it the first thing in the post, with descriptive alt text ("Freshly mulched flower bed with shredded hardwood").
   - Every *other* image: in HTML view, add `loading="lazy"` to its `<img>` tag.
4. **Experience (E-E-A-T, the one thing AI pages can't fake):** fill the `ADD YOUR EXPERIENCE` / `ADD YOUR PHOTO` spots, even 2 sentences with what you did, measured or paid.
5. **Preview on your phone**, then Publish. Publish 3–4 posts a week at most, never in bursts.

## Never

- Stock or AI images passed off as your own garden.
- Fake reviews, ratings or credentials, in the text or in schema.
- Publishing a draft with "ADD YOUR…" notes still empty. They're hidden comments, but the experience they ask for is the point.
